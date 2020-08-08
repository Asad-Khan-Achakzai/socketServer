let app = require("express")();
let http = require("http").Server(app);
let io = require("socket.io")(http);
var mongoose = require("mongoose");
var shortid = require('shortid');
const { stringify } = require("querystring");


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
    console.log('chatData =',chatData);
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
    // socket.on("set-recieverForCustomerInbox", (recieverForInbox) => {
    //   socket.recieverForInbox = recieverForInbox;
    //   console.log('reciever for inbox =',socket.recieverForInbox);
    //   Chat.find({ $or:[{recieverId: socket.recieverForInbox},{senderId:socket.recieverForInbox}]    }, function (err, docs) {
    //     if (err) {
    //       throw err;
    //     }
    //     console.log("data", docs);
  
    //     // Emit the messages
    //     socket.emit("CustomerinboxData", docs);
    //   });});
  //   socket.on("set-recieverForCustomerInbox", (recieverForInbox) => {
  //     socket.recieverForInbox = recieverForInbox;
  //     console.log('called = ',socket.recieverForInbox);
      

  //   //   Chat
  //   //     .find({reciever: socket.recieverForInbox})
  //   //     .limit(100)
  //   //     .toArray(function (err, res) {
  //   //       if (err) {
  //   //         throw err;
  //   //       }
  //   //       console.log('data',res);

  //   //       // Emit the messages
  //   //       socket.emit("output", res);
  //   // });

  //   // socket.on("getChat", function (name) {
  //   //   Chat
  //   //     .find(name)
  //   //     .limit(100)
  //   //     .toArray(function (err, res) {
  //   //       if (err) {
  //   //         throw err;
  //   //       }

  //   //       // Emit the messages
  //   //       socket.emit("output", res);
  //   //     });
  // });
  
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
      reciverImage_url: message.reciverImage_url,
      senderImage_url:message.senderImage_url,
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
      reciverImage_url: message.reciverImage_url,
      senderImage_url:message.senderImage_url,
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

var chatSchema = mongoose.Schema({
  msgId:String,
  senderId:String,
  name: String,
  recieverId:String,
  reciever: String,
  msg: String,
  status: String,
  created: { type: Date, default: Date.now },
  reciverImage_url: String,
  senderImage_url:String,
});

var Chat = mongoose.model("Message", chatSchema);



const mongoCon = "mongodb+srv://asadkhan:pakistan@cluster0.updrb.gcp.mongodb.net/fyp?retryWrites=true&w=majority";


    const connect = async function () {
      return mongoose.connect(mongoCon, {
        useNewUrlParser: true,
      //  useCreateIndex: true,
        useUnifiedTopology: true
      });
    };
mongoose.connection.on('connected',()=>{
  console.log('connected');
});
    (async () => {
      try {
        
        const connected = await connect();
        console.log('connected');
      } catch (e) {
        console.log("Error happend while connecting to the DB: ", e);
      }
    })();


var port = process.env.PORT || 3001;

http.listen(port, function () {
  console.log("listening in http://localhost:" + port);
});
