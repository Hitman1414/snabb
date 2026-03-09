import logging
from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)
from requests.exceptions import ConnectionError, HTTPError

logger = logging.getLogger(__name__)

def send_push_message(token, message, extra=None):
    """
    Send a push notification using Expo Server SDK.
    """
    try:
        response = PushClient().publish(
            PushMessage(to=token,
                        body=message,
                        data=extra))
    except PushServerError as exc:
        # Encountered some likely formatting/validation error.
        logger.error(f"PushServerError: {exc.errors}")
        raise
    except (ConnectionError, HTTPError) as exc:
        # Encountered some Connection or HTTP error - retry a few times in
        # production, but for now just log it.
        logger.error(f"Push ConnectionError/HTTPError: {exc}")
        raise

    try:
        # We got a response back, but we don't know whether it's an error yet
        # This call raises errors so we can handle them with normal exception flows.
        response.validate_response()
    except DeviceNotRegisteredError:
        # Expo token is no longer valid, we should mark it as invalid in the DB.
        logger.warning(f"Device not registered. The push token {token} is invalid.")
        return False
    except PushTicketError as exc:
        logger.error(f"PushTicketError: {exc.push_response._asdict()}")
        raise
    
    logger.info(f"Push notification sent successfully to {token}")
    return True
