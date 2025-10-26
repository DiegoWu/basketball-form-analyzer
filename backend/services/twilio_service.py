from twilio.rest import Client
import os

def send_sms(body: str, to: str) -> str:
    account_sid = 'AC399d41a56f86b7107a9dad1ff0ead609'
    auth_token = 'b85816ac689c9cfead6ca22846f9d6e3'
    client = Client(account_sid, auth_token)
    message = client.messages.create(
    from_='+18446686102',
    body= body,
    to='+18777804236'
    )
    print(message.sid)
    return message.sid