define(['character'], function(Character) {

    var NpcTalk = {
        "guard": [
            "Hello there",
            "We don't need to see your identification",
            "You are not the player we're looking for",
            "Move along, move along..."
        ],
    
        "king": [
            "Hi, I'm the King",
            "I run this place",
            "Like a boss",
            "I talk to people",
            "Like a boss",
            "I wear a crown",
            "Like a boss",
            "I do nothing all day",
            "Like a boss",
            "Now leave me alone",
            "Like a boss"
        ],
    
        "villagegirl": [
            "Leave all the hope ye that enter here.",
            "I want to die, I think that would be nice",
            "You seem nice. Do you want to hang out, have a little suicide together?",
            "Actually, I listen to Lady Gaga secretly all the time."
        ],
    
        "villager": [
            "OMG! Call 911",
            "...",
            "...",
            "...",
            "Hurry up!"
        ],
    
        "agent": [
            "Oppa Gangnam Style",
            "Gangnam Style",
            "Op, op, op, op",
            "Eh-eh-eh, eh-eh-eh",
            "Oppa Gangnam Style"
        ],
    
        "rick": [
            "We're no strangers to love",
            "You know the rules and so do I",
            "A full commitment's what I'm thinking of",
            "You wouldn't get this from any other guy",
            "I just wanna tell you how I'm feeling",
            "Gotta make you understand",
            "Never gonna give you up",
            "Never gonna let you down",
            "Never gonna run around and desert you",
            "Never gonna make you cry",
            "Never gonna say goodbye",
            "Never gonna tell a lie and hurt you"
        ],
        
        "scientist": [
            "Music is a higher revelation than all wisdom and philosophy",
            "It is the mediator between the spiritual and sensual life",
            "Now, why don't you grab me a beer? ignorant...",
            "You know nothing about music, go dubstep somewhere else"
        ],
    
        "nyan": [
            "nyan nyan nyan nyan nyan",
            "nyan nyan nyan nyan nyan nyan nyan",
            "nyan nyan nyan nyan nyan nyan",
            "nyan nyan nyan nyan nyan nyan nyan nyan"
        ],
        
        "beachnpc": [
            "lorem ipsum dolor sit amet",
            "consectetur adipisicing elit, sed do eiusmod tempor"
        ],
        
        "forestnpc": [
            "lorem ipsum dolor sit amet",
            "consectetur adipisicing elit, sed do eiusmod tempor"
        ],
        
        "desertnpc": [
            "lorem ipsum dolor sit amet",
            "consectetur adipisicing elit, sed do eiusmod tempor"
        ],
        
        "lavanpc": [
            "lorem ipsum dolor sit amet",
            "consectetur adipisicing elit, sed do eiusmod tempor"
        ],
    
        "priest": [
            "Oh, hello, young man.",
            "Wisdom is everything, so I'll share a few guidelines with you.",
            "You are free to go wherever you like in this world",
            "but beware of the many foes that await you.",
            "You can find many weapons and armors by killing enemies.",
            "The tougher the enemy, the higher the potential rewards.",
            "You can also unlock achievements by exploring and hunting.",
            "Click on the small cup icon to see a list of all the achievements.",
            "Please stay a while and enjoy the many surprises of BrowserQuest",
            "Farewell, young friend."
        ],
        
        "sorcerer": [
            "Ah... I had foreseen you would come to see me.",
            "Well? How do you like my new staff?",
            "Pretty cool, eh?",
            "Where did I get it, you ask?",
            "I understand. It's easy to get envious.",
            "I actually crafted it myself, using my mad wizard skills.",
            "But let me tell you one thing...",
            "There are lots of items in this game.",
            "Some more powerful than others.",
            "In order to find them, exploration is key.",
            "Good luck."
        ],
        
        "octocat": [
            "Welcome to BrowserQuest!",
            "Want to see the source code?",
            'Check out <a target="_blank" href="http://github.com/mozilla/BrowserQuest">the repository on GitHub</a>'
        ],
        
        "coder": [
            "Hi! Do you know that you can also play BrowserQuest on your tablet or mobile?",
            "That's the beauty of HTML5!",
            "Give it a try..."
        ],
    
        "beachnpc": [
            "Don't mind me, I'm just here on vacation.",
            "I have to say...",
            "These giant crabs are somewhat annoying.",
            "Could you please get rid of them for me?"
        ],
        
        "desertnpc": [
            "One does not simply walk into these mountains...",
            "An ancient undead lord is said to dwell here.",
            "Nobody knows exactly what he looks like...",
            "...for none has lived to tell the tale.",
            "It's not too late to turn around and go home, kid."
        ],
    
        "othernpc": [
            "lorem ipsum",
            "lorem ipsum"
        ]
    };

    var Npc = Character.extend({
        init: function(id, kind) {
            this._super(id, kind, 1);
            this.itemKind = Types.getKindAsString(this.kind);
            this.talkCount = NpcTalk[this.itemKind].length;
            this.talkIndex = 0;
        },
    
        talk: function() {
            var msg = null;
        
            if(this.talkIndex > this.talkCount) {
                this.talkIndex = 0;
            }
            if(this.talkIndex < this.talkCount) {
                msg = NpcTalk[this.itemKind][this.talkIndex];
            }
            this.talkIndex += 1;
            
            return msg;
        }
    });
    
    return Npc;
});
