import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Trash2 } from 'lucide-react';

const VoiceRecorder = ({ onVoiceRecorded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        
        setAudioBlob(blob);
        setAudioURL(url);
        onVoiceRecorded(blob);
    
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioURL) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioBlob(null);
    setAudioURL(null);
    setIsPlaying(false);
    setRecordingTime(0);
    onVoiceRecorded(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder">
      {!audioBlob ? (
        // Recording interface
        <div className="recording-interface">
          <div className="recording-controls">
            {!isRecording ? (
              <button 
                type="button"
                className="record-btn start"
                onClick={startRecording}
              >
                <Mic className="record-icon" />
                <span>Start Recording</span>
              </button>
            ) : (
              <div className="recording-active">
                <button 
                  type="button"
                  className="record-btn stop"
                  onClick={stopRecording}
                >
                  <Square className="record-icon" />
                  <span>Stop Recording</span>
                </button>
                <div className="recording-status">
                  <div className="recording-indicator">
                    <div className="pulse-dot"></div>
                    <span>Recording...</span>
                  </div>
                  <div className="recording-time">
                    {formatTime(recordingTime)}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {isRecording && (
            <div className="recording-waveform">
              <div className="waveform-bars">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="waveform-bar"></div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="playback-interface">
          <audio
            ref={audioRef}
            src={audioURL}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          <div className="audio-player">
            <div className="player-controls">
              <button
                type="button"
                className="play-btn"
                onClick={isPlaying ? pauseAudio : playAudio}
              >
                {isPlaying ? (
                  <Pause className="play-icon" />
                ) : (
                  <Play className="play-icon" />
                )}
              </button>
              
              <div className="audio-info">
                <div className="audio-title">Voice Message</div>
                <div className="audio-duration">
                  Duration: {formatTime(recordingTime)}
                </div>
              </div>
              
              <button
                type="button"
                className="delete-btn"
                onClick={deleteRecording}
                title="Delete recording"
              >
                <Trash2 className="delete-icon" />
              </button>
            </div>
            
            <div className="audio-waveform">
              <div className="static-waveform">
                {[...Array(30)].map((_, i) => (
                  <div 
                    key={i} 
                    className="static-bar"
                    style={{ 
                      height: `${20 + Math.random() * 40}%`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="voice-recorder-note">
        <p> Voice messages help responders understand the urgency and details of the situation</p>
      </div>
    </div>
  );
};

export default VoiceRecorder;