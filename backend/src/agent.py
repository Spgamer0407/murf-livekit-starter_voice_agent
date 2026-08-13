import os
import logging
import json
import random

import db

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    tokenize,
    room_io,
    function_tool,
    RunContext,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# Automated Fail-Safe Toggle for Video Demo
# This counter will make every 2nd call to fetch_exercise fail automatically
fetch_call_count = 0

# Change this prompt to change what your voice agent does.
# See README.md for example prompts (customer support, language tutor, receptionist).
SYSTEM_PROMPT = """
IDENTITY:
You are Shiksha, an encouraging and patient English Communication Coach for learners in India. Your goal is to help users improve their spoken and written English confidence.

OBJECTIVES:
1. Help users practice conversational English in a supportive, judgment-free environment.
2. Correct major grammar or vocabulary errors gently by providing a refined alternative while keeping the conversation flowing.
3. Encourage users to speak in full sentences and express their ideas clearly.

MEMORY & TOOLS:
- You have memory of past callers. When you meet someone new, ask them for their name. If you don't catch their name clearly or if it's unusual, politely ask them to spell it out for you letter by letter. Use `lookup_caller` to see if you have spoken before.
- ALWAYS use English/Latin script for the `name` argument when calling tools, even if the user speaks in Hindi. (e.g. use "Srinivas" instead of "श्रीनिवास").
- If you know their name and they have facts saved, greet them warmly by referencing a past topic or mistake they are working on (e.g. "Welcome back Ramesh, last time we practiced workplace English. Shall we continue?").
- During the call, learn their current English level, topics they want to cover, and common mistakes they make.
- At the end of the call, or when appropriate, ALWAYS ASK PERMISSION to save these facts. Say: "I would like to remember this for next time. Is that okay?" 
- If they say yes, use `save_caller_info` to save their level, topics, and mistakes. If they say no, DO NOT SAVE.
- When the user asks for a practice exercise, a new word, or when you want to test their skills, use `get_vocabulary_exercise` with their level ("beginner", "intermediate", or "advanced") to get a new word. After providing the exercise, ask them to make a sentence with it.
- When the user successfully completes a vocabulary exercise by using the word in a sentence correctly, ALWAYS call the `mark_exercise_completed` tool to track their success.

HUMAN ESCALATION (DAY 7):
- You must create a request for a human teacher (using `create_escalation`) in these TWO specific situations:
  1. The learner is highly frustrated or upset with their progress and explicitly asks for or clearly needs a human teacher.
  2. The learner asks for complex exam guidance or queries that are completely outside your boundaries as an AI.
- BEFORE escalating, you MUST explicitly ask for their permission and how they want to be contacted (e.g. phone or email). Do NOT ask them for a preferred time. Instead, YOU must proactively pick a specific time within the next 24 hours (e.g., "tomorrow at 2 PM" or "tomorrow morning at 10 AM"). Do NOT create the escalation if they refuse permission.
- If they agree, use `create_escalation` to file a ticket, providing the specific time you chose as the `time_slot`.
- After successfully creating the ticket, give them a natural confirmation using their Name, the specific Scheduled Time Slot you picked, and the Ticket ID (e.g., "I've arranged for a human teacher to contact Srinivas tomorrow at 2 PM. For your records, your reference ID is 2.").

KNOWLEDGE BOUNDARIES:
- You know English grammar, vocabulary, pronunciation tips, and conversational nuance.
- You DO NOT provide medical, legal, financial, or academic diagnostic advice.

LANGUAGE & SCRIPT:
- Code-Mixing Support: If the user speaks in Hinglish or drops Hindi words, understand them seamlessly and reply in friendly English with occasional clear Hinglish bridges if they struggle, guiding them back to English practice.
- Always write every language in its own native script.
- Hindi → Devanagari (नमस्ते), never romanized (never "namaste"). Same rule for all non-English languages.
- Keep tone warm, encouraging, polite, and clear.

GUARDRAILS (HARD CONSTRAINTS):
1. NEVER shame, ridicule, or criticize a user for incorrect grammar or vocabulary.
2. NEVER diagnose learning disabilities, speech disorders, or medical conditions (e.g., do not comment on dyslexia, stammering/stuttering as a condition, etc.).
3. NEVER write full academic essays or complete graded assignments for the user without guiding them.
4. ESCALATION SCRIPT: If asked for medical or diagnostic advice, strictly refuse using this exact intent:
   "Main ek English Learning Coach hoon. Medical, diagnostic, ya out-of-scope guidance dena mere authority ke bahar hai. Kripya is baare mein kisi specialist, doctor, ya official authority se baat karein."

STYLE & VOICE CONSTRAINTS (FOR TTS):
- Keep output concise (1-3 short sentences per turn).
- Avoid complex markdown, bullet points, or special characters so the text converts cleanly to speech audio via Murf Falcon.
"""


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)
        self.call_successful = False

    @function_tool
    async def mark_exercise_completed(self, context: RunContext):
        """Use this tool when the learner has successfully completed an exercise by making a sentence with the new word."""
        logger.info("Marking exercise as completed.")
        self.call_successful = True
        return "Noted that the exercise was completed."

    @function_tool
    async def lookup_caller(self, context: RunContext, name: str):
        """Use this tool to look up a returning caller's information.
        
        Args:
            name: The name of the user to look up.
        """
        logger.info(f"Looking up caller: {name}")
        info = db.get_user_info(name)
        if info:
            return f"Found user {name}. Facts: {json.dumps(info)}"
        else:
            return f"User {name} not found. This is a new caller."

    @function_tool
    async def save_caller_info(self, context: RunContext, name: str, level: str, topics: str, mistakes: str):
        """Use this tool to save a user's facts to the database ONLY AFTER they have explicitly given you permission.
        
        Args:
            name: The name of the user.
            level: The user's current English level.
            topics: The topics covered or that they want to cover.
            mistakes: Mistakes they keep making.
        """
        logger.info(f"Saving info for caller: {name}")
        success = db.save_user_info(name, level, topics, mistakes)
        if success:
            return f"Successfully saved facts for {name}."
        else:
            return f"Failed to save facts for {name}."

    @function_tool
    async def get_vocabulary_exercise(self, context: RunContext, level: str):
        """Fetch a vocabulary exercise by level from the local curriculum database.
        
        Args:
            level: The user's English level (must be "beginner", "intermediate", or "advanced").
        """
        global fetch_call_count
        fetch_call_count += 1
        
        logger.info(f"Fetching exercise for level: {level} (Call count: {fetch_call_count})")
        try:
            # Force failure on every 2nd request for the video demo
            if fetch_call_count % 2 == 0:
                raise ConnectionError("Database unreachable")

            # Simulate a real API call or database fetch using our local dataset
            file_path = os.path.join(os.path.dirname(__file__), "exercises.json")
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            exercises = data.get("exercises", {})
            
            level_key = level.lower()
            if level_key not in exercises:
                level_key = "beginner"
                
            options = exercises[level_key]
            exercise = random.choice(options)
            
            return (
                f"Fetched from the August 2026 local curriculum database for {level} level: "
                f"Word: '{exercise['word']}', Meaning: '{exercise['meaning']}'."
            )
        except Exception as e:
            logger.error(f"Failed to fetch exercise: {e}")
            return "ERROR: The local exercise database is currently offline."

    @function_tool
    async def create_escalation(self, context: RunContext, name: str, issue_summary: str, urgency: str, preferred_follow_up: str, time_slot: str):
        """Use this tool to escalate an issue to a human teacher ONLY AFTER asking for permission.
        
        Args:
            name: The name of the user who needs help.
            issue_summary: A short summary of what happened, what was checked, and why they need help. Do not include PII like passwords.
            urgency: The urgency level (must be "low", "medium", "high", or "emergency").
            preferred_follow_up: The user's preferred follow-up method and language (e.g., "phone call in Hindi" or "email in English").
            time_slot: The user's preferred time for the callback (e.g., "tomorrow morning", "Friday afternoon").
        """
        logger.info(f"Escalating issue for {name} with urgency {urgency}")
        
        follow_up_details = f"{preferred_follow_up} at {time_slot}"
        ticket_id = db.create_escalation_ticket(name, issue_summary, urgency, follow_up_details)
        
        if ticket_id:
            return f"Successfully created escalation ticket. Tell the user: 'I have arranged for a human teacher to contact {name} {time_slot}. Your reference ID is {ticket_id}.'"
        else:
            return "Failed to create escalation ticket due to an internal error."


server = AgentServer()


def prewarm(proc: JobProcess):
    db.init_db()
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name=os.getenv("AGENT_NAME", "my-agent"))
async def my_agent(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using Murf Falcon, Gemini, Deepgram, and the LiveKit turn detector
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=deepgram.STT(model="nova-3", language="multi"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=google.LLM(
                model="gemini-3.5-flash-lite",
            ),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=murf.TTS(
                voice="Anisha", 
                style="Conversation",
                tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
                text_pacing=True
            ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Start the session, which initializes the voice pipeline and warms up the models
    assistant = Assistant()
    await session.start(
        agent=assistant,
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )
    
    @ctx.room.on("disconnected")
    def on_disconnected():
        status = "successful" if assistant.call_successful else "failed"
        logger.info(f"Call disconnected. Outcome: {status}")
        db.record_call_outcome(status)

    # Join the room and connect to the user
    await ctx.connect()

    # Agent says the first-turn greeting
    if ctx.room.name.startswith("outbound"):
        greeting = "Hello! This is Shiksha, your English communication coach. I am calling to practice conversational English with you today. If you'd like to end this call at any time, just say 'stop' or hang up."
    else:
        greeting = "नमस्ते! I am Shiksha, your English communication coach. May I know who I am speaking with today?"
        
    await session.say(greeting, allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(server)
