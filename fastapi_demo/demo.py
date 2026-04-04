from fastapi import FastAPI

# 1. This creates your application
app = FastAPI()

# 2. This creates a "Route". 
# When a user visits the root web address ("/"), it runs this function.
@app.get("/")
def say_hello():
    return {"message": "Hello World!"}

# 3. Let's make another route!
# If a user visits "/greet/Ameya", the variable 'name' becomes "Ameya".
@app.get("/greet/{name}")
def greet_person(name: str):
    return {"message": f"Welcome to FastAPI, {name}!"}
