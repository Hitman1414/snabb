import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI async client
# Requires OPENAI_API_KEY in .env
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_bot_response(prompt: str, context: str) -> str:
    """
    Generate a response from the bot based on its system prompt and the context (Ask description).
    """
    try:
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": context}
            ],
            temperature=0.7,
            max_tokens=250
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating bot response: {e}")
        return "I am experiencing technical difficulties at the moment."

async def analyze_match(ask_description: str, user_profile: str) -> float:
    """
    Basic mock-up for matchmaking. In reality, you'd use embeddings.
    Here we just ask the LLM to score the match on a scale of 0.0 to 1.0.
    """
    try:
        sys_prompt = "You are an AI Matchmaker. Given an Ask and a User Profile, output ONLY a float between 0.0 and 1.0 representing how good a match they are."
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": f"Ask: {ask_description}\nProfile: {user_profile}"}
            ],
            temperature=0.0,
            max_tokens=10
        )
        score_str = completion.choices[0].message.content.strip()
        # strip out non-numeric chars if any
        score = float(score_str)
        return min(max(score, 0.0), 1.0)
    except Exception as e:
        print(f"Error generating match score: {e}")
        return 0.0

import asyncio
from sqlalchemy.orm import Session
from . import models

from .database import SessionLocal

def process_new_ask_sync(ask_id: int):
    """
    Synchronous wrapper to run the async bot processing in FastAPI BackgroundTasks.
    Creates its own session.
    """
    db = SessionLocal()
    try:
        asyncio.run(process_new_ask(ask_id, db))
    finally:
        db.close()

async def process_new_ask(ask_id: int, db: Session):
    """
    Background worker that checks if any Bots should respond to a newly created Ask.
    """
    try:
        ask = db.query(models.Ask).filter(models.Ask.id == ask_id).first()
        if not ask:
            return
            
        # Get all server bots
        bots = db.query(models.User).filter(
            models.User.is_bot == True, 
            models.User.bot_role == 'server'
        ).all()
        
        for bot in bots:
            # Simple matching logic based on system prompt OR we can just try to generate a response
            # If the bot is meant to respond to everything or specific categories.
            # For this MVP, let's have the bot always bid if it's a server bot.
            
            prompt = bot.bot_prompt or "You are a helpful AI assistant who can complete this task."
            context = f"Title: {ask.title}\nDescription: {ask.description}\nCategory: {ask.category}"
            
            response_text = await generate_bot_response(prompt, context)
            
            # Create a response in DB
            new_response = models.Response(
                ask_id=ask.id,
                user_id=bot.id,
                message=response_text,
                bid_amount=ask.budget_min or 10.0  # Simple mock bid
            )
            db.add(new_response)
            db.commit()
            print(f"Bot {bot.username} responded to Ask {ask.id}")
            
        # Get all matchmaker bots
        matchmakers = db.query(models.User).filter(
            models.User.is_bot == True, 
            models.User.bot_role == 'matchmaker'
        ).all()
        
        for mm_bot in matchmakers:
            # Find human users in the same location
            users_in_area = db.query(models.User).filter(
                models.User.is_bot == False,
                models.User.location == ask.location,
                models.User.id != ask.user_id
            ).all()
            
            for user in users_in_area:
                mm_prompt = mm_bot.bot_prompt or "You are a friendly Matchmaker. Write a short 2 sentence direct message to a user notifying them of a new Ask in their area."
                mm_context = f"Ask Title: {ask.title}\nCategory: {ask.category}\nUser Name: {user.username}"
                
                mm_msg_text = await generate_bot_response(mm_prompt, mm_context)
                
                # Send a direct message from the matchmaker bot to the human user
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

def process_support_message_sync(message_id: int, db: Session):
    asyncio.run(process_support_message(message_id, db))

async def process_support_message(message_id: int, db: Session):
    try:
        msg = db.query(models.Message).filter(models.Message.id == message_id).first()
        if not msg:
            return
            
        receiver = db.query(models.User).filter(models.User.id == msg.receiver_id).first()
        if not receiver or not receiver.is_bot or receiver.bot_role != 'support':
            return
            
        # Receiver is a support bot. Generate a reply.
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
