// Declare 'peer' globally so it can be accessed across functions


const form = document.getElementById("form");
const userId = document.getElementById("userId");
const errorMsg = document.getElementById("errorMsg");
const submit = document.getElementById("sbtn");
const msgco = document.getElementById("msgcontent");
const idblock = document.getElementById("idmaker");
let userIdValue = "";

function getvalidation() {
  userIdValue = userId.value;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

  if (userIdValue == null || !regex.test(userIdValue)) {
      errorMsg.style.display = "inline";
      console.log("error");
  } else {
      errorMsg.style.display = "none";
      idblock.style.display = "none";
      msgco.style.display = "block";
      initializePeer(userIdValue); 
  }
  
  //console.log(userIdValue); // Debugging output
  return userIdValue;
}

// Initialize Peer connection
function initializePeer(userId) {
  console.log(userId)
  let newid = userId
  var peer = new Peer(newid); // Assigning peer with userId
  console.log("hey");
  console.log(peer);
  let connections = {};
  let currentChat = null;
  let messageHistory = {}; // Store message history in memory

  peer.on('open', (id) => {
    document.getElementById('my-id').value = id;
  });

  // Function to connect to a peer
  function connectToPeer(peerId) {
    if (peerId && !connections[peerId]) {
      const conn = peer.connect(peerId);
      setupConnection(conn);
    }
  }

  // Handle connection requests
  peer.on('connection', (conn) => {
    if (!connections[conn.peer]) {
      setupConnection(conn);
    }
  });

  function setupConnection(conn) {
    conn.on('open', () => {
      connections[conn.peer] = conn;
      addPeerToList(conn.peer);

      // Load existing messages from localStorage
      if (localStorage.getItem(conn.peer)) {
        messageHistory[conn.peer] = JSON.parse(localStorage.getItem(conn.peer));
      } else {
        messageHistory[conn.peer] = [];
      }

      // Listen for incoming messages
      conn.on('data', (data) => {
        if (conn.peer === currentChat) {
          addMessage('Peer', data, conn.peer);
        } else {
          notifyNewMessage(conn.peer);
          messageHistory[conn.peer].push({ sender: 'Peer', message: data });
          saveMessages(conn.peer);
        }
      });
    });
  }

  // Send message
  document.getElementById('send-btn').addEventListener('click', () => {
    if (currentChat && connections[currentChat]) {
      const message = document.getElementById('message').value;
      if (message.trim() !== '') {
        addMessage('You', message, currentChat);
        connections[currentChat].send(message);
        document.getElementById('message').value = '';
      }
    }
  });

  // Add peer to the list
  function addPeerToList(peerId) {
    const peerList = document.getElementById('peer-list');
    const peerItem = document.createElement('li');
    peerItem.textContent = peerId;
    peerItem.addEventListener('click', () => switchChat(peerId));
    peerList.appendChild(peerItem);
  }

  // Switch chat
  function switchChat(peerId) {
    currentChat = peerId;
    document.querySelectorAll('#peer-list li').forEach(item => item.classList.remove('active'));
    document.querySelector(`#peer-list li:nth-child(${Object.keys(connections).indexOf(peerId) + 1})`).classList.add('active');
    clearChatBox();

    if (messageHistory[peerId]) {
      messageHistory[peerId].forEach(msg => {
        addMessage(msg.sender, msg.message, peerId, false);
      });
    }
  }

  // Add message to the chat box and save history
  function addMessage(sender, message, peerId, shouldSave = true) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.textContent = `${sender}: ${message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (shouldSave) {
      messageHistory[peerId].push({ sender, message });
      saveMessages(peerId);
    }
  }

  // Save messages to localStorage
  function saveMessages(peerId) {
    localStorage.setItem(peerId, JSON.stringify(messageHistory[peerId]));
  }

  // Clear chat box
  function clearChatBox() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
  }

  // Notify new message
  function notifyNewMessage(peerId) {
    const peerListItem = Array.from(document.querySelectorAll('#peer-list li')).find(item => item.textContent === peerId);
    peerListItem.style.fontWeight = 'bold';
  }

  // Connect button action
  document.getElementById('connect-btn').addEventListener('click', () => {
    const peerId = document.getElementById('peer-id').value;
    connectToPeer(peerId);
  });
}

