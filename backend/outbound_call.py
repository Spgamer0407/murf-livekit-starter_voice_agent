import os
import asyncio
import uuid
from dotenv import load_dotenv
from livekit import api

load_dotenv(".env.local")

async def main():
    # Initialize the LiveKit API client
    lk_api = api.LiveKitAPI(
        os.getenv("LIVEKIT_URL"),
        os.getenv("LIVEKIT_API_KEY"),
        os.getenv("LIVEKIT_API_SECRET"),
    )
    
    sip_uri = os.getenv("LINPHONE_SIP_URI")
    sip_trunk_id = os.getenv("LIVEKIT_SIP_TRUNK_ID")
    agent_name = os.getenv("AGENT_NAME", "my-agent")
    
    if not sip_uri or not sip_trunk_id:
        print("Error: LINPHONE_SIP_URI and LIVEKIT_SIP_TRUNK_ID must be set in .env.local")
        return
        
    # Generate a unique room name for this outbound call
    # The 'outbound' prefix is used by agent.py to recognize this as an outbound call
    room_name = f"outbound-call-{uuid.uuid4().hex[:8]}"
    
    try:
        # 1. Dispatch the agent to the new room so it's ready when the SIP call connects
        print(f"Dispatching agent '{agent_name}' to room '{room_name}'...")
        await lk_api.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name=agent_name,
                room=room_name,
            )
        )
        
        # 2. Initiate the outbound SIP call
        print(f"Initiating outbound call to {sip_uri}...")
        participant = await lk_api.sip.create_sip_participant(
            api.CreateSIPParticipantRequest(
                sip_trunk_id=sip_trunk_id,
                sip_call_to=sip_uri.replace("sip:", "").split("@")[0],
                room_name=room_name,
                participant_identity=f"sip_{sip_uri.split(':')[1]}",
                participant_name="SIP Caller"
            )
        )
        print("Outbound call initiated successfully.")
        print("Waiting for SIP user to connect and agent to respond...")
        
    except Exception as e:
        print(f"Failed to initiate outbound call: {e}")
    finally:
        await lk_api.aclose()

if __name__ == "__main__":
    asyncio.run(main())
