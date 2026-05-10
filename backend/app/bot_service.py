"""
Bot Service - AI-powered bots using Google Gemini.
Handles server bots (auto-bidding), matchmaker bots (notifying users),
and support bots (answering user messages).
"""
import asyncio
from google import genai
from sqlalchemy.orm import Session

from . import models
from .database import SessionLocal
from .config import settings


def _get_gemini_client():
    """Get a configured Gemini client. Returns None if key is not set."""
    if not settings.GEMINI_API_KEY:
        return None
    return genai.Client(api_key=settings.GEMINI_API_KEY)


async def generate_bot_response(prompt: str, context: str) -> str:
    """
    Generate a response from a bot based on its system prompt and the context (Ask description).
    Uses Gemini 2.5 Flash for fast, cost-effective responses.
    """
    client = _get_gemini_client()
    if not client:
        print("AI bot features are disabled because GEMINI_API_KEY is not set.")
        return "I am experiencing technical difficulties at the moment. (AI Disabled)"
    try:
        full_prompt = f"{prompt}\n\nContext: {context}"
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt,
        )
        if response and response.text:
            return response.text.strip()
        return "I am unable to generate a response at this time."
    except Exception as e:
        print(f"Error generating bot response: {e}")
        return "I am experiencing technical difficulties at the moment."


async def analyze_match(ask_description: str, user_profile: str) -> float:
    """
    Matchmaking score using Gemini. Returns a float between 0.0 and 1.0
    representing how well a user's profile matches an Ask.
    """
    client = _get_gemini_client()
    if not client:
        return 0.0
    try:
        prompt = f"""You are an AI Matchmaker. Given an Ask and a User Profile, output ONLY a float between 0.0 and 1.0 representing how good a match they are. No other text.

Ask: {ask_description}
Profile: {user_profile}"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        if response and response.text:
            score = float(response.text.strip())
            return min(max(score, 0.0), 1.0)
        return 0.0
    except Exception as e:
        print(f"Error generating match score: {e}")
        return 0.0


async def process_new_ask(ask_id: int):
    """
    Background worker that checks if any Bots should respond to a newly created Ask.
    """
    db = SessionLocal()
    try:
        ask = db.query(models.Ask).filter(models.Ask.id == ask_id).first()
        if not ask:
            return

        # Get all server bots
        bots = db.query(models.User).filter(
            models.User.is_bot,
            models.User.bot_role == 'server'
        ).all()

        for bot in bots:
            prompt = bot.bot_prompt or "You are a helpful AI assistant who can complete this task."
            context = f"Title: {ask.title}\nDescription: {ask.description}\nCategory: {ask.category}"

            response_text = await generate_bot_response(prompt, context)

            new_response = models.Response(
                ask_id=ask.id,
                user_id=bot.id,
                message=response_text,
                bid_amount=ask.budget_min or 10.0
            )
            db.add(new_response)
            db.commit()
            print(f"Bot {bot.username} responded to Ask {ask.id}")

        # Get all matchmaker bots
        matchmakers = db.query(models.User).filter(
            models.User.is_bot,
            models.User.bot_role == 'matchmaker'
        ).all()

        for mm_bot in matchmakers:
            users_in_area = db.query(models.User).filter(
                ~models.User.is_bot,
                models.User.location == ask.location,
                models.User.id != ask.user_id
            ).all()

            for user in users_in_area:
                mm_prompt = mm_bot.bot_prompt or "You are a friendly Matchmaker. Write a short 2 sentence direct message to a user notifying them of a new Ask in their area."
                mm_context = f"Ask Title: {ask.title}\nCategory: {ask.category}\nUser Name: {user.username}"

                mm_msg_text = await generate_bot_response(mm_prompt, mm_context)

                new_msg = models.Message(
                    sender_id=mm_bot.id,
                    receiver_id=user.id,
                    ask_id=ask.id,
                    content=mm_msg_text
                )
                db.add(new_msg)

            db.commit()
            if users_in_area:
                print(f"Matchmaker {mm_bot.username} notified {len(users_in_area)} users about Ask {ask.id}")

    except Exception as e:
        print(f"Background Bot Task Error: {e}")
    finally:
        db.close()


async def process_support_message(message_id: int):
    db = SessionLocal()
    try:
        msg = db.query(models.Message).filter(models.Message.id == message_id).first()
        if not msg:
            return

        receiver = db.query(models.User).filter(models.User.id == msg.receiver_id).first()
        if not receiver or not receiver.is_bot or receiver.bot_role != 'support':
            return

        sender = db.query(models.User).filter(models.User.id == msg.sender_id).first()
        prompt = receiver.bot_prompt or "You are Snabb Support Bot. Help the user with their issue politely and concisely."
        context = f"User: {sender.username}\nMessage: {msg.content}"

        reply_text = await generate_bot_response(prompt, context)

        new_reply = models.Message(
            sender_id=receiver.id,
            receiver_id=sender.id,
            ask_id=msg.ask_id,
            content=reply_text
        )
        db.add(new_reply)
        db.commit()
        print(f"Support bot {receiver.username} replied to {sender.username}")

    except Exception as e:
        print(f"Support Bot Task Error: {e}")
    finally:
        db.close()
