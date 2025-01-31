import { useEffect, useState } from 'react';
import './App.css';
import { socket } from './socket';
import CryptoJS from 'crypto-js';

function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [decryptionPassword, setDecryptionPassword] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('message', (message: string) => {
      console.log('message received at client:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.disconnect();
      socket.off('connect');
      socket.off('message');
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && password.trim()) {
      const encrypted = CryptoJS.AES.encrypt(input, password).toString();
      socket.emit('message', encrypted);
      setInput('');
      setPassword('');
    }
  };

  const handleDecryption = (e: React.FormEvent) => {
    e.preventDefault();
    if (decryptionPassword.trim()) {
      const decrypted = CryptoJS.AES.decrypt(selectedMessage, decryptionPassword).toString(CryptoJS.enc.Utf8);
      if (decrypted.trim()){
        setSelectedMessage(decrypted);
      } else {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000); // Hide toast after 3 seconds
      }
      setDecryptionPassword('');
    }
  };

  const togglePopup = (message?: string) => {
    if (message) {
      setSelectedMessage(message);
    }
    setShowPopup(!showPopup);
  };

  return (
    <div className="App">
      <h1>Spy Chat</h1>
      <div className="messages">
        {messages.map((message, index) => (
          <div 
            onClick={() => togglePopup(message)}
            key={index}
            >
              {message}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <input
         type="text"
         value={password}
         onChange={(e) => setPassword(e.target.value)}
         placeholder="Type a password"
         />
        <button type="submit">Send</button>
      </form>
      {showPopup && (
        <div className="popup">
          <div className="popup-inner">
            <h2>Decrypt Message</h2>
            <p>{selectedMessage}</p>
            <form onSubmit={handleDecryption}>
              <input              
                className="popup-inner-input"
                type="text"
                value={decryptionPassword}
                onChange={(e) => setDecryptionPassword(e.target.value)}
                placeholder="Type a password to decrypt"
              />
              <button type="submit">Decrypt</button>
            </form>
            <button onClick={() => togglePopup()}>Close</button>
          {showToast && (
            <div className="toast">
              Invalid password. Please try again.
            </div>
          )}
          </div>
        </div>
        )}
    </div>
  );
}

export default App;