const express = require("express");
const { MongoClient, ObjectId, ObjectID } = require("mongodb");
const fs = require("fs");
const router = express.Router();
const config = require("../config");
const { response } = require("express");
const { Z_ASCII } = require("zlib");

const dbURI = `mongodb+srv://Canstopme0:${config.uriKey}@fesibrut-api.dkfxl.mongodb.net/users?retryWrites=true&w=majority`;
const mongoClient = new MongoClient(dbURI);

let feisbrutDB, usersCollection;

/* -----------------------------------------------------LOGIN---------------------------------------------------------------------- */
router.post("/login", async (req, res) => {
  let newReq = req.body;
  let data = [];
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => data.push(user));
  let result = data.filter(
    (user) =>
      user.email === newReq.email &&
      user.password === newReq.password 
      
  );
  console.log(result)
  if (result.length > 0 ) {

    if(result[0].confirmed){let newUser = await usersCollection.findOne({ email: newReq.email });

    function randomString(length, chars) {
      let mask = "";
      if (chars.indexOf("a") > -1) mask += "abcdefghijklmnopqrstuvwxyz";
      if (chars.indexOf("A") > -1) mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (chars.indexOf("#") > -1) mask += "0123456789";
      let result = "";
      for (let i = length; i > 0; --i)
        result += mask[Math.floor(Math.random() * mask.length)];
      return result;
    }

    /* console.log(randomString(16, 'aA'));
  console.log(randomString(32, '#aA')); */

    let token =  randomString(32, "#aA");
    let timeNow = Date.now();
    const update = {
      $set: {
        login_time: timeNow,
        user_token: token,
        checkSession: true,
        logged: true,
      },
    };
    const filter = { email: newReq.email };
    const ris = await usersCollection.updateOne(filter, update);

    let finalUser = await usersCollection.findOne({ email: newReq.email });

    let notifyId = newUser.notify.map((not) => not.who);
    let friendsNot = [];
    notifyId.forEach((element) =>
      data.map((friend) => {
        if (friend.id === element) {
          let newFriend = {
            name: friend.name,
            surname: friend.surname,
            photo: friend.photo,
            id: friend.id,
          };
          friendsNot.push(newFriend);
        }
      })
    );
    const ids = friendsNot.map((o) => o.id);
    const filtered = friendsNot.filter(
      ({ id }, index) => !ids.includes(id, index + 1)
    );

    let finalResult = result.map((user) => {
      let myFriends = [];
      let iteration = [...user.friends].map((friendsId) =>
        [...data].filter((friend) => friend.id === friendsId)
      );
      iteration.map((user) => {
        user.map((friend) => myFriends.push(friend));
      });
      let myFinalFriends = myFriends.map((friend) => {
        return (friend = {
          name: friend.name,
          surname: friend.surname,
          photo: friend.photo,
          id: friend.id,
          login_time: friend.login_time,
          bio: friend.bio,
        });
      });
      let myFriendsReq = [];
      let iteration2 = [...user.friendreq].map((friendsId) =>
        [...data].filter((friend) => friend.id === friendsId)
      );
      iteration2.map((user) => {
        user.map((friend) => myFriendsReq.push(friend));
      });
      let myFinalFriendsReq = myFriendsReq.map((friend) => {
        return (friend = {
          name: friend.name,
          surname: friend.surname,
          photo: friend.photo,
          id: friend.id,
        });
      });
      let myFriendsRec = [];
      let iteration3 = [...user.friendrec].map((friendsId) =>
        [...data].filter((friend) => friend.id === friendsId)
      );
      iteration3.map((user) => {
        user.map((friend) => myFriendsRec.push(friend));
      });
      let myFinalFriendsRec = myFriendsRec.map((friend) => {
        return (friend = {
          name: friend.name,
          surname: friend.surname,
          photo: friend.photo,
          id: friend.id,
        });
      });
      let myNotify = [];
      let iteration4 = [...user.notify].map((not) => myNotify.push(not));
      let finalNotify = myNotify.map((not) => {
        return (newNot = {
          ...not,
          user: filtered.filter((friend) => friend.id === not.who),
        });
      });

      ////////// QUELLO CHE HO AGGIUNTO O MODIFICATO IO ////////////////////
      let newMessages = {};
      Object.keys(user.messages).forEach((single) => {
        const friendFinder = data.filter((friend) => friend.id === single);
        newMessages = {
          ...newMessages,
          [single]: {
            discussion: user.messages[single],
            user: {
              name: friendFinder[0].name,
              surname: friendFinder[0].surname,
              photo: friendFinder[0].photo,
              id: friendFinder[0].id,
            },
          },
        };
      });

      return (user = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        photo: user.photo,
        friends: [...myFinalFriends],
        bio: user.bio,
        friendreq: [...myFinalFriendsReq],
        friendrec: [...myFinalFriendsRec],
        messages: newMessages,
        confirmed: user.confirmed,
        notify: [...finalNotify],
        login_time: finalUser.login_time,
        user_token: finalUser.user_token,
        logged: finalUser.logged,
        checkSession: finalUser.checkSession,
        db_id: user._id,
      });
    });

    res.send(finalResult);} else{ res.send({ response: "Utente non confermato" })}
  }else {
    res.send({ response: "Nome Utente o Password Errati" });
  }
});

/* -----------------------------------------------------/LOGIN---------------------------------------------------------------------- */

/* -----------------------------------------------------CHECKSESSION---------------------------------------------------------------------- */
router.post("/checksession/:id", async (req, res) => {
  const userId = req.params["id"];
  let data = [];
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => data.push(user));
/* 
  function randomString(length, chars) {
    let mask = "";
    if (chars.indexOf("a") > -1) mask += "abcdefghijklmnopqrstuvwxyz";
    if (chars.indexOf("A") > -1) mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (chars.indexOf("#") > -1) mask += "0123456789";
    let result = "";
    for (let i = length; i > 0; --i)
      result += mask[Math.floor(Math.random() * mask.length)];
    return result;
  } */

  let newReq = req.body;
  let myFinalUser = await usersCollection.findOne({ id: newReq.userId });
  let now = Date.now() / 60000;
  let lastLogin = newReq.login_time / 60000;
  if (
    newReq.logged &&
    now - lastLogin < 20 &&
    newReq.user_token === myFinalUser.user_token
  ) {
    /* let token = `65fdjs453bdfgs765dhshbf8asee3` /* randomString(32, "#aA") */; 
    let timeNow = Date.now();
    const update = {
      $set: { login_time: timeNow, logged: true },
    };
    const filter = { id: newReq.userId };
    const ris = await usersCollection.updateOne(filter, update);

    /* let newUser = await usersCollection.findOne({ id: newReq.userId }); */

    let notifyId = myFinalUser.notify.map((not) => not.who);
    let friendsNot = [];
    notifyId.forEach((element) =>
      data.map((friend) => {
        if (friend.id === element) {
          let newFriend = {
            name: friend.name,
            surname: friend.surname,
            photo: friend.photo,
            id: friend.id,
            bio: friend.bio,
          };
          friendsNot.push(newFriend);
        }
      })
    );
    const ids = friendsNot.map((o) => o.id);
    const filtered = friendsNot.filter(
      ({ id }, index) => !ids.includes(id, index + 1)
    );

    let myFriends = [];
    let iteration = [...myFinalUser.friends].map((friendsId) =>
      [...data].filter((friend) => friend.id === friendsId)
    );
    iteration.map((user) => {
      user.map((friend) => myFriends.push(friend));
    });
    let myFinalFriends = myFriends.map((friend) => {
      return (friend = {
        name: friend.name,
        surname: friend.surname,
        photo: friend.photo,
        id: friend.id,
        login_time: friend.login_time,
      });
    });

    let myFriendsReq = [];
    let iteration2 = [...myFinalUser.friendreq].map((friendsId) =>
      [...data].filter((friend) => friend.id === friendsId)
    );
    iteration2.map((user) => {
      user.map((friend) => myFriendsReq.push(friend));
    });
    let myFinalFriendsReq = myFriendsReq.map((friend) => {
      return (friend = {
        name: friend.name,
        surname: friend.surname,
        photo: friend.photo,
        id: friend.id,
      });
    });

    let myFriendsRec = [];
    let iteration3 = [...myFinalUser.friendrec].map((friendsId) =>
      [...data].filter((friend) => friend.id === friendsId)
    );
    iteration3.map((user) => {
      user.map((friend) => myFriendsRec.push(friend));
    });
    let myFinalFriendsRec = myFriendsRec.map((friend) => {
      return (friend = {
        name: friend.name,
        surname: friend.surname,
        photo: friend.photo,
        id: friend.id,
      });
    });

    let myNotify = [];
    let iteration4 = [...myFinalUser.notify].map((not) => myNotify.push(not));
    let finalNotify = myNotify.map((not) => {
      return (newNot = {
        ...not,
        user: filtered.filter((friend) => friend.id === not.who),
      });
    });

    let newMessages = {};
    Object.keys(myFinalUser.messages).forEach((single) => {
      const friendFinder = data.filter((friend) => friend.id === single);
      newMessages = {
        ...newMessages,
        [single]: {
          discussion: myFinalUser.messages[single],
          user: {
            name: friendFinder[0].name,
            surname: friendFinder[0].surname,
            photo: friendFinder[0].photo,
            id: friendFinder[0].id,
          },
        },
      };
    });

    userResponse = {
      id:newReq.userId,
      name: myFinalUser.name,
      surname: myFinalUser.surname,
      email: myFinalUser.email,
      photo: myFinalUser.photo,
      friends: myFinalFriends,
      bio: myFinalUser.bio,
      friendreq: myFinalFriendsReq,
      friendrec: myFinalFriendsRec,
      messages: newMessages,
      confirmed: myFinalUser.confirmed,
      notify: finalNotify,
      login_time: myFinalUser.login_time,
      user_token: myFinalUser.user_token,
      logged: myFinalUser.logged,
      checkSession: myFinalUser.checkSession,
      db_id: myFinalUser._id,
    };

    res.send(userResponse);
  } else if (
    newReq.user_token === user.user_token &&
    !user.checkSession &&
    newReq.logged
  ) {
    /* let token = `65fdjs453bdfgs765dhshbf8asee3` *//* randomString(32, "#aA") */;
    let timeNow = Date.now();
    const update = {
      $set: { login_time: timeNow, logged: true },
    };
    const filter = { id: newReq.userId };
    const ris = await usersCollection.updateOne(filter, update);

    let newUser = await usersCollection.findOne({ id: newReq.userId });

    let notifyId = newUser.notify.map((not) => not.who);
    let friendsNot = [];
    notifyId.forEach((element) =>
      data.map((friend) => {
        if (friend.id === element) {
          let newFriend = {
            name: friend.name,
            surname: friend.surname,
            photo: friend.photo,
            id: friend.id,
          };
          friendsNot.push(newFriend);
        }
      })
    );
    const ids = friendsNot.map((o) => o.id);
    const filtered = friendsNot.filter(
      ({ id }, index) => !ids.includes(id, index + 1)
    );

    let myFriends = [];
    let iteration = [...newUser.friends].map((friendsId) =>
      [...data].filter((friend) => friend.id === friendsId)
    );
    iteration.map((user) => {
      user.map((friend) => myFriends.push(friend));
    });
    let myFinalFriends = myFriends.map((friend) => {
      return (friend = {
        name: friend.name,
        surname: friend.surname,
        photo: friend.photo,
        id: friend.id,
        login_time: friend.login_time,
      });
    });

    let myFriendsReq = [];
    let iteration2 = [...newUser.friendreq].map((friendsId) =>
      [...data].filter((friend) => friend.id === friendsId)
    );
    iteration2.map((user) => {
      user.map((friend) => myFriendsReq.push(friend));
    });
    let myFinalFriendsReq = myFriendsReq.map((friend) => {
      return (friend = {
        name: friend.name,
        surname: friend.surname,
        photo: friend.photo,
        id: friend.id,
      });
    });

    let myFriendsRec = [];
    let iteration3 = [...newUser.friendrec].map((friendsId) =>
      [...data].filter((friend) => friend.id === friendsId)
    );
    iteration3.map((user) => {
      user.map((friend) => myFriendsRec.push(friend));
    });
    let myFinalFriendsRec = myFriendsRec.map((friend) => {
      return (friend = {
        name: friend.name,
        surname: friend.surname,
        photo: friend.photo,
        id: friend.id,
      });
    });

    let myNotify = [];
    let iteration4 = [...newUser.notify].map((not) => myNotify.push(not));
    let finalNotify = myNotify.map((not) => {
      return (newNot = {
        ...not,
        user: filtered.filter((friend) => friend.id === not.who),
      });
    });

    let newMessages = {};
    Object.keys(newUser.messages).forEach((single) => {
      const friendFinder = data.filter((friend) => friend.id === single);
      newMessages = {
        ...newMessages,
        [single]: {
          discussion: newUser.messages[single],
          user: {
            name: friendFinder[0].name,
            surname: friendFinder[0].surname,
            photo: friendFinder[0].photo,
            id: friendFinder[0].id,
          },
        },
      };
    });

    userResponse = {
      id:newReq.userId,
      name: newUser.name,
      surname: newUser.surname,
      email: newUser.email,
      photo: newUser.photo,
      friends: myFinalFriends,
      bio: newUser.bio,
      friendreq: myFinalFriendsReq,
      friendrec: myFinalFriendsRec,
      messages: newMessages,
      confirmed: newUser.confirmed,
      notify: finalNotify,
      login_time: newUser.login_time,
      user_token: newUser.user_token,
      logged: newUser.logged,
      checkSession: newUser.checkSession,
      db_id: newUser._id,
    };

    res.send(userResponse);
  } else {
    const update = { $set: { logged: false } };
    const filter = { id: newReq.userId };
    const ris = await usersCollection.updateOne(filter, update);
    res.send({ logged: false });
  }
});
/* -----------------------------------------------------/CHECKSESSION---------------------------------------------------------------------- */

/* -----------------------------------------------------USER SIMPLE GET---------------------------------------------------------------------- */
router.get("/users", async (req, res) => {
  let data = [];
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => {
    user = {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      photo: user.photo,
      friends: user.friends,
      bio: user.bio,
      confirmed: user.confirmed,
    };
    data.push(user);
  });
  res.send(data);
});
/* -----------------------------------------------------/USER GLOBAL GET---------------------------------------------------------------------- */

/* -----------------------------------------------------USER POST---------------------------------------------------------------------- */
router.post("/users", async (req, res) => {
  const newUserId = Date.now().toString();
  newReq = req.body;



  let data = [];
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => data.push(user));
  let result = data.filter(
    (user) =>
      user.email === newReq.email
      
  );
  if(result.length >0){
    res.send({response:"indirizzo email già in uso."})
  } else {

    let newObject = { id: newUserId, ...newReq };
    const ris = await usersCollection.insertOne(newObject);
  
    if (ris.acknowledged) {
      let newUser = await usersCollection.findOne({ id: newUserId });
      res.status(200).send({response:"Controlla la tua mail per confermare il tuo Account.", id:newUser._id});
    }
  }
});

/* -----------------------------------------------------/USER POST---------------------------------------------------------------------- */


/* -----------------------------------------------------USER CONFIRMATION---------------------------------------------------------------------- */
router.post('/confirmation', async (req,res) =>{
  let newReq = req.body
  let newUser = await usersCollection.findOne({ _id :ObjectId(newReq.id)});
  if(!newUser.confirmed){
    let filter = { _id :ObjectId(newReq.id)}
    let update = {$set : {confirmed:true}}
    const ris = await usersCollection.updateOne(filter, update);   
    
    res.send({response:"utente confermato"})

  } else {res.send({response:"Link Scaduto"})}
})


/* -----------------------------------------------------/USER CONFIRMATION---------------------------------------------------------------------- */



/* -----------------------------------------------------USER SINGLE GET---------------------------------------------------------------------- */

router.get("/users/:id", async (req, res) => {
  let data = [];
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => {
    data.push(user);
  });

  const userId = req.params["id"];
  let user = await usersCollection.findOne({ id: userId });

  let myFriends = [];
  let iteration = [...user.friends].map((friendsId) =>
    [...data].filter((friend) => friend.id === friendsId)
  );
  iteration.map((user) => {
    user.map((friend) => myFriends.push(friend));
  });
  let myFinalFriends = myFriends.map((friend) => {
    return (friend = {
      name: friend.name,
      surname: friend.surname,
      photo: friend.photo,
      id: friend.id,
      bio: friend.bio,
    });
  });

  user = {
    id: user.id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    photo: user.photo,
    friends: [...myFinalFriends],
    bio: user.bio,
    confirmed: user.confirmed,
    login_time: user.login_time,
  };
  res.send(user);
});

/* -----------------------------------------------------/USER SINGLE GET---------------------------------------------------------------------- */

/* -----------------------------------------------------USER SINGLE PATCH---------------------------------------------------------------------- */
router.patch("/users/:id", async (req, res) => {
  const userId = req.params["id"];
  newReq = req.body

  let data = [];
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => data.push(user));
  let result = data.filter(
    (user) =>
    user._id.toString() === newReq._id 
    
    );
    
    

  if(result){
    newObject ={
    name:newReq.name,
    surname:newReq.surname,
    email:newReq.email,
    photo:newReq.photo,
    bio:newReq.bio
  }
  console.log(newObject)
  const update = { $set: newObject };
  const filter = { _id :ObjectId(newReq._id)};
  const ris = await usersCollection.updateOne(filter, update);
  res.send([{ response_: `user id:${userId} updated` }]);
} else {res.send({response:"accesso non autorizzato"})}
  
});
/* -----------------------------------------------------/USER SINGLE PATCH---------------------------------------------------------------------- */

/* -----------------------------------------------------USER SINGLE DELETE---------------------------------------------------------------------- */
router.delete("/users/:id", async (req, res) => {
  const userId = req.params["id"];
  const ris = await usersCollection.deleteOne({ id: userId });
  res.status(200).send([{ response_: `user id:${userId} removed` }]);
});
/* -----------------------------------------------------/USER SINGLE DELETE---------------------------------------------------------------------- */

/* -----------------------------------------------------SEND FRIEND REQUEST---------------------------------------------------------------------- */

router.post("/sendfriendrequest", async (req, res) => {
  let newReq = req.body;
  const myId = newReq.myId;
  const friendId = newReq.friendId;
  let me = await usersCollection.findOne({ id: myId });
  let friend = await usersCollection.findOne({ id: friendId });
  const updateMe = { $set: { friendreq: [...me.friendreq, friendId] } };
  const updateFriend = {
    $set: {
      friendrec: [...friend.friendrec, myId],
      notify: [
        ...friend.notify,
        {
          type: "friendrec",
          who: `${myId}`,
          date: new Date().toISOString(),
          read: false,
          notify_id: Date.now().toString(),
        },
      ],
    },
  };

  if (me.friendreq.includes(friendId) || me.friendrec.includes(friendId)) {
    res.send([{ response_: "Richiesta Già Inviata!" }]);
  } else if (me.friends.includes(friendId)) {
    res.send([{ response_: "Gli Utenti sono Già Amici!" }]);
  } else {
    const filterMe = { id: myId };
    const risMe = await usersCollection.updateOne(filterMe, updateMe);
    const filterFriend = { id: friendId };
    const risFriend = await usersCollection.updateOne(
      filterFriend,
      updateFriend
    );
    res.send([{ response_: "richiesta di amicizia inviata" }]);
  }
});
/* -----------------------------------------------------/SEND FRIEND REQUEST---------------------------------------------------------------------- */

/* -----------------------------------------------------CONFIRM FRIEND REQUEST---------------------------------------------------------------------- */

router.post("/confirmfriendrequest", async (req, res) => {
  let newReq = req.body;
  const myId = newReq.myId;
  const friendId = newReq.friendId;
  let me = await usersCollection.findOne({ id: myId });
  let friend = await usersCollection.findOne({ id: friendId });
  const updateMe = {
    $set: { friendrec: [...me.friendrec.filter((rec) => rec !== friendId)] },
  };
  const updateFriend = {
    $set: { friendreq: [...friend.friendreq.filter((requ) => requ !== myId)] },
  };
  const addFriendToMe = { $set: { friends: [...me.friends, friendId] } };
  const addMeToFriend = {
    $set: {
      friends: [...friend.friends, myId],
      notify: [
        ...friend.notify,
        {
          type: "friendConfirmed",
          who: `${myId}`,
          date: new Date().toISOString(),
          read: false,
          notify_id: Date.now().toString(),
        },
      ],
    },
  };

  async function clearReqRec() {
    const filterMe = { id: myId };
    const risMe = await usersCollection.updateOne(filterMe, updateMe);
    const filterFriend = { id: friendId };
    const risFriend = await usersCollection.updateOne(
      filterFriend,
      updateFriend
    );
  }

  switch (newReq.confirmed) {
    case true:
      clearReqRec();
      const risMe = await usersCollection.updateOne(
        { id: myId },
        addFriendToMe
      );
      const risFriend = await usersCollection.updateOne(
        { id: friendId },
        addMeToFriend
      );

      res.send([{ response: "accettato" }]);
      break;
    case false:
      clearReqRec();

      res.send([{ response: "rifiutato" }]);
      break;
  }
});

/* -----------------------------------------------------/CONFIRM FRIEND REQUEST---------------------------------------------------------------------- */

/* -----------------------------------------------------GET FRIENDS---------------------------------------------------------------------- */
router.post("/getfriends", async (req, res) => {
  newReq = req.body;
  let data = [];
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => {
    user = {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      photo: user.photo,
      friends: user.friends,
      bio: user.bio,
      cover: user.cover,
      login_time: user.login_time,
    };
    data.push(user);
  });
  const result = data.filter((item) => [...newReq].includes(item.id));

  res.send(result);
});
/* -----------------------------------------------------/GET FRIENDS---------------------------------------------------------------------- */

/* -----------------------------------------------------NOTIFICATION MANAGER---------------------------------------------------------------------- */

router.post("/notificationmanager", async (req, res) => {
  newReq = req.body;

  if (newReq.type === "delete") {
    newReq.notification_id.map((not) =>
      usersCollection.updateOne(
        { id: newReq.userId },
        { $pull: { notify: { notify_id: not } } }
      )
    );
    const response = [{ response: "notifiche cancellate con successo" }];
    res.send(response);
  } else if (newReq.type === "patch") {
    const user = await usersCollection.findOne({ id: newReq.userId });

    let finalResult = [];
    user.notify.map((not) => finalResult.push({ ...not, read: true }));
    usersCollection.updateOne(
      { id: newReq.userId },
      { $set: { notify: finalResult } }
    );

    const response = [{ response: "notifiche aggiornate con successo" }];
    res.send(response);
  }
});

/* -----------------------------------------------------/NOTIFICATION MANAGER---------------------------------------------------------------------- */

/* -----------------------------------------------------SEARCHBAR---------------------------------------------------------------------- */
router.post("/searchbar", async (req, res) => {
  newReq = req.body;
  let data = [];
  let query = newReq.text.replace(/\s/g, "");
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => {
    let myFriends = [];
    let iteration = [...user.friends].map((friendsId) =>
      [...data].filter((friend) => friend.id === friendsId)
    );
    iteration.map((user) => {
      user.map((friend) => myFriends.push(friend));
    });
    let myFinalFriends = myFriends.map((friend) => {
      return (friend = {
        name: friend.name,
        surname: friend.surname,
        photo: friend.photo,
        id: friend.id,
        login_time: friend.login_time,
        bio: friend.bio,
      });
    });
    user = {
      id: user.id,
      queryName: user.name + user.surname,
      name: user.name,
      surname: user.surname,
      photo: user.photo,
      friends: [...myFinalFriends],
      bio: user.bio,
      cover: user.cover,
      confirmed: user.confirmed,
      login_time: user.login_time,
    };
    data.push(user);
  });

  const filtered = data.filter(
    (user) => user.id !== newReq.author_id && user.confirmed
  );
  const finalUser = [];
  filtered.filter(
    (user) =>
      user.queryName.toLocaleLowerCase().search(query.toLocaleLowerCase()) >
        -1 && finalUser.push(user)
  );

  console.log(finalUser);
  if (finalUser.length > 0) {
    res.send(finalUser);
  } else {
    res.send([{ response: "nessun utente trovato" }]);
  }
});

/* -----------------------------------------------------/SEARCHBAR---------------------------------------------------------------------- */

/* -----------------------------------------------------RANDOMUSER---------------------------------------------------------------------- */
router.post("/randomusers", async (req, res) => {
  newReq = req.body;
  let data = [];
  const me = await usersCollection.findOne({ id: newReq.userId });
  const cursor = usersCollection.find({});
  await cursor.forEach((user) => {
    user = {
      id: user.id,
      name: user.name,
      surname: user.surname,
      photo: user.photo,
      friends: user.friends,
      bio: user.bio,
      cover: user.cover,
      confirmed: user.confirmed,
    };
    data.push(user);
  });
  let filtered = [];
  if (me.friends.length > 0) {
    me.friends.map(
      (friend) =>
        (filtered = data.filter(
          (user) =>
            user.id !== newReq.userId && user.id !== friend && user.confirmed
        ))
    );
  } else {
    filtered = data.filter(
      (user) => user.id !== newReq.userId && user.confirmed
    );
  }

  const shuffled = filtered.sort(() => 0.5 - Math.random());
  let selected = shuffled.slice(0, 4);
  console.log(selected);

  if (selected.length > 0) {
    res.send(selected);
  } else {
    res.send([]);
  }
});
/* -----------------------------------------------------/RANDOMUSER---------------------------------------------------------------------- */

/* -----------------------------------------------------MESSAGES---------------------------------------------------------------------- */
router.post("/instantmessage", async (req, res) => {
  action = req.body;
  const me = await usersCollection.findOne({ id: action.my_id });
  const friend = await usersCollection.findOne({ id: action.friend_id });
  let myDestination = friend.id;
  let friendDestination = me.id;

  if (me.messages[myDestination]) {
    
    
    let myNewMessageForMe = {
      author: action.my_id,
      text: action.text,
      read: true,
      date: new Date().toISOString(),
    };

    

    const filterMe = { id: action.my_id };


   let finalMessage = { ...me.messages, [myDestination]:[...me.messages[myDestination],myNewMessageForMe ]} 
    updateMe = {
      $set: { messages: finalMessage},
    };
    
    const risMe = await usersCollection.updateOne(filterMe, updateMe);
    console.log("esiste per me");
    console.log(me.messages[myDestination])


  }else {

    const filterMe = { id: action.my_id };
    updateMe = {
      $set: {
        messages: {
          ...me.messages,
          [myDestination]: [
            {
              author: friendDestination,
              date: new Date().toISOString(),
              text: action.text,
              read: true,
            },
          ],
        },
      },
    };
    
    
    const risMe = await usersCollection.updateOne(filterMe, updateMe);
   
    console.log("non esiste per me");
  }
  
  
  
  
  
  
  
  
  
  if (friend.messages[friendDestination]) {


    

    
    let myNewMessage = {
      author: action.my_id,
      text: action.text,
      read: false,
      date: new Date().toISOString(),
    };

    
    
    let finalMessage = { ...friend.messages, [friendDestination]:[...friend.messages[friendDestination],myNewMessage] };
    const filterFriend = { id: action.friend_id };
    updateFriend = {
      $set: {messages: finalMessage},
    };
    


    const risFriend = await usersCollection.updateOne(
      filterFriend,
      updateFriend
    );
    console.log("esiste per l'amico");


  } else {
    
    const filterFriend = { id: action.friend_id };
    updateFriend = {
      $set: {
        messages: {
          ...friend.messages,
          [friendDestination]: [
            {
              author: friendDestination,
              date: new Date().toISOString(),
              text: action.text,
              read: false,
            },
          ],
        },
      },
    };

    const risFriend = await usersCollection.updateOne(filterFriend,updateFriend);
    

    console.log("non esiste per l'amico");
  } 

  const finalMe = await usersCollection.findOne({ id: action.my_id });
  const finalFriend = await usersCollection.findOne({ id: action.friend_id });
  res.send({ me: finalMe, friend: finalFriend });
});

/* -----------------------------------------------------/MESSAGES---------------------------------------------------------------------- */

/* -----------------------------------------------------READ MESSAGES---------------------------------------------------------------------- */
router.post("/readmessages", async (req, res) => {
  action = req.body;
  const me = await usersCollection.findOne({ id: action.my_id });
  const friend = await usersCollection.findOne({ id: action.friend_id });
  let myDestination = action.friend_id;
  let friendDestination = action.my_id;
 if(me.messages[myDestination]){

   
     let read = me.messages[myDestination].map((element) =>({...element,read:true})
     );
     
 
     const filterMe = { id: action.my_id };
     updateMe = {
       $set: { messages: { ...me.messages, [myDestination]: read } },
     };    
 
     const risMe = await usersCollection.updateOne(filterMe, updateMe);
     
     console.log(read)
     res.send([{ response: "update effettuato correttamente" }]);  
 } else {res.send([{ response: "chat non trovata" }])}
});

/* -----------------------------------------------------/READ MESSAGES---------------------------------------------------------------------- */

/* -----------------------------------------------------DELETE MESSAGES---------------------------------------------------------------------- */

router.post("/deletemessages", async (req, res) => {
  newReq = req.body;

  const user = await usersCollection.findOne({ id: newReq.userId });
  let myMessages = user.messages;
  newReq.chatId.map((element) => delete myMessages[element]);

  const risMe = await usersCollection.updateOne(
    { id: newReq.userId },
    { $set: { messages: myMessages } }
  );
  res.send([{ response: "chat eliminata con successo" }]);
});

/* -----------------------------------------------------/DELETE MESSAGES---------------------------------------------------------------------- */

/* -----------------------------------------------------CONNECTIONS---------------------------------------------------------------------- */

async function run() {
  await mongoClient.connect();
  console.log("siamo connessi con atlas Users!");

  feisbrutDB = mongoClient.db("feisbrut");
  usersCollection = feisbrutDB.collection("users");
}

run().catch((err) => console.log("Errore" + err));

module.exports = router;
