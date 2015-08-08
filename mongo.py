# Create profiles
from pymongo import MongoClient

client = MongoClient('localhost', 27017)

db = client.Nader
users = db.users

def add_user(username, skills, interests):
    post = {
        "username":username,
        "skills": skills,
        "interests": interests
    }
    users.insert_one(post)

#add_user("rome_bop", "Sleeping", "Korean")
#add_user("Nader", "Napping", "Rome")
#add_user("Brian", "Eating", "Food")

for user in users.find():
    print "Username: " + str(user["username"]) + ", Skills: " + str(user["skills"]) + ", Interests: " + str(user["interests"])