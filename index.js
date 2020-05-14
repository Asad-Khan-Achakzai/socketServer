let app = require("express")();
let http = require("http").Server(app);
let io = require("socket.io")(http);
var mongoose = require("mongoose");
var shortid = require('shortid');


io.on("connection", (socket) => {
  socket.on("disconnect", function () {
    io.emit("users-changed", { user: socket.nickname, event: "left" });
  });

  socket.on("set-nickname", (nickname) => {
    socket.nickname = nickname;
    io.emit("users-changed", { user: nickname, event: "joined" });
  });
  socket.on("set-type", (type) => {
    socket.type = type;
  });
  socket.on("set-reciever", (reciever) => {
    socket.reciever = reciever;
  });
  socket.on("set-getChat", (chatData) => {
    //console.log('function called')
    socket.recieverForInbox = chatData[0];
    socket.sender = chatData[1];
    // console.log("reciever = ", socket.recieverForInbox);
    // console.log("sender = ", socket.sender);
    // Chat.find(
    //   {
    //     $and: [
    //       {  $or: [{ reciever: socket.recieverForInbox }, { reciever: socket.sender }]},
    //       { $or: [{ name: socket.recieverForInbox }, { name: socket.sender }] }
    //     ]
    //   },
    Chat.find(
      {
        $and: [
          {  $or: [{ recieverId: socket.recieverForInbox }, { recieverId: socket.sender }]},
          { $or: [{ senderId: socket.recieverForInbox }, { senderId : socket.sender }] }
        ]
      },
      function (err, docs) {
        //Chat.find({ reciever: socket.recieverForInbox,name:socket.sender}, function (err, docs) {
        if (err) {
          throw err;
        }
       // console.log("data", docs);

        // Emit the messages
        socket.emit("output", docs);
      }
    );
  });
  socket.on("set-recieverForInbox", (recieverForInbox) => {
    socket.recieverForInbox = recieverForInbox;
    console.log('reciever for inbox =',socket.recieverForInbox);
    Chat.find({ recieverId: socket.recieverForInbox }, function (err, docs) {
      if (err) {
        throw err;
      }
      console.log("data", docs);

      // Emit the messages
      socket.emit("inboxData", docs);
    });});
    socket.on("set-recieverForCustomerInbox", (recieverForInbox) => {
      socket.recieverForInbox = recieverForInbox;
      console.log('called = ',socket.recieverForInbox);
      Chat.find({ recieverId: socket.recieverForInbox }, function (err, docs) {
        if (err) {
          throw err;
        }
       // console.log("data", docs);
  
        // Emit the messages
        socket.emit("customerInboxData", docs);
      });

    //   Chat
    //     .find({reciever: socket.recieverForInbox})
    //     .limit(100)
    //     .toArray(function (err, res) {
    //       if (err) {
    //         throw err;
    //       }
    //       console.log('data',res);

    //       // Emit the messages
    //       socket.emit("output", res);
    // });

    // socket.on("getChat", function (name) {
    //   Chat
    //     .find(name)
    //     .limit(100)
    //     .toArray(function (err, res) {
    //       if (err) {
    //         throw err;
    //       }

    //       // Emit the messages
    //       socket.emit("output", res);
    //     });
  });
  
  socket.on("set-status", (id) =>{ 
    console.log('function called id  = ',id);
    Chat.updateOne({ msgId: id }, { status: "read" }, function(
      err,
      result
    ) { console.log("saved, err = " + err);
    if (err) throw err;
    console.log('result = ',result);
      // if (err) {
      //   console.log('Error = ',err)
      //  // res.send(err);
      // } else {
      //   console.log('status updated of = ',newMsg)
      //   //res.json(result);
      // }
    });
  //  console.log('status updated of = ',newMsg)
  });
  socket.on("add-message", (message) => {
    let id = shortid.generate();
    io.emit("message", {
      msgId: id,
      senderId:message.senderId,
      name: message.sender,
      recieverId: message.recieverId,
      reciever: message.reciever,
      msg: message.text,
      status: message.status,
      //from: socket.nickname,
      created: new Date(),
    });
    // console.log(socket.type);
    // console.log(socket.nickname);
    // console.log(message);
    // console.log(socket.reciever);
    var newMsg = new Chat({
      msgId : id,
      senderId:message.senderId,
      name: message.sender,
      recieverId: message.recieverId,
      reciever: message.reciever,
      msg: "" + message.text,
      status: message.status,
    });
  //  console.log("saving newMsg: " + newMsg);
    newMsg.save(function (err) {
      console.log("saved, err = " + err);
      if (err) throw err;
      console.log("echoeing back data =" + newMsg);
      io.sockets.emit("new message", message);
    });
  });
});
//previous data
//   socket.on("add-message", (message) => {
//     io.emit("message", {
//       text: message.text,
//       from: socket.nickname,
//       created: new Date(),
//     });
//     console.log(socket.type);
//     console.log(socket.nickname);
//     console.log(message);
//     console.log(socket.reciever);
//     var newMsg = new Chat({
//       msg: "" + message.text,
//       name: socket.nickname,
//       reciever: socket.reciever,
//       status: "unread",
//     });
//     console.log("saving newMsg: " + newMsg);

//     newMsg.save(function (err) {
//       console.log("saved, err = " + err);
//       if (err) throw err;
//       console.log("echoeing back data =" + message);
//       io.sockets.emit("new message", message);
//     });
//   });
// });
var chatSchema = mongoose.Schema({
  msgId:String,
  senderId:String,
  name: String,
  recieverId:String,
  reciever: String,
  msg: String,
  status: String,
  created: { type: Date, default: Date.now },
});

var Chat = mongoose.model("Message", chatSchema);

mongoose.connect("mongodb://localhost/customerMessages", function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected to mongodb!");
  }
});

var port = process.env.PORT || 3001;

http.listen(port, function () {
  console.log("listening in http://localhost:" + port);
});
