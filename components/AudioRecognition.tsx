'use client';

import { useState, useRef, useEffect } from 'react';
import {
  CheckCircle,
  Loader2,
  Music,
  Upload,
  XCircle,
  Mic,
  Square,
} from 'lucide-react';
import Image from '../app/namem2.jpg';
import Search1 from '../app/search1';
import Animation from '../app/animation';

function generateSearchLink(platform: string, songName: string, artistName: string = '') {
  const query = encodeURIComponent(`${songName} ${artistName}`);
  switch (platform.toLowerCase()) {
    case 'gaana':
      return `https://gaana.com/search/${encodeURIComponent(songName)}`;
    case 'amazon music':
      return `https://music.amazon.com/search/${query}`;
    case 'apple music':
      return `https://music.apple.com/us/search?term=${encodeURIComponent(songName)}`;
    case 'jiosaavn':
      return `https://www.google.com/search?q=${query}+site:jiosaavn.com`;
    case 'wynk':
      return `https://www.google.com/search?q=${query}+site:wynk.in`;
    default:
      return '#';
  }
}

const platforms = ['Gaana', 'Amazon Music', 'Apple Music', 'Jiosaavn', 'Wynk'];

export default function AudioRecognition() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [conversionStatus, setConversionStatus] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Added ref for result section
  const resultRef = useRef<HTMLDivElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setAudioURL(null);
      setError('');
      setSuccess(false);
    }
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const convertToWav = async (audioBlob: Blob): Promise<File> => {
    setIsConverting(true);
    setConversionStatus('Converting to WAV...');
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const numOfChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const bitsPerSample = 16;
      const bytesPerSample = bitsPerSample / 8;
      const dataLength = audioBuffer.length * numOfChannels * bytesPerSample;
      const bufferLength = 44 + dataLength;
      const wavBuffer = new ArrayBuffer(bufferLength);
      const view = new DataView(wavBuffer);

      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + dataLength, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numOfChannels * bytesPerSample, true);
      view.setUint16(32, numOfChannels * bytesPerSample, true);
      view.setUint16(34, bitsPerSample, true);
      writeString(view, 36, 'data');
      view.setUint32(40, dataLength, true);

      let offset = 44;
      for (let i = 0; i < audioBuffer.length; i++) {
        for (let channel = 0; channel < numOfChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
          const value = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
          view.setInt16(offset, value, true);
          offset += bytesPerSample;
        }
      }

      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const wavFile = new File([wavBlob], 'recorded-audio.wav', {
        type: 'audio/wav',
        lastModified: Date.now(),
      });

      setConversionStatus('Conversion complete');
      setIsConverting(false);
      return wavFile;
    } catch (err) {
      console.error('WAV Conversion Error:', err);
      setIsConverting(false);
      throw err;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);

        try {
          const wavFile = await convertToWav(audioBlob);
          setFile(wavFile);
        } catch (err) {
          setError('Audio conversion failed');
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000);
    } catch (err) {
      setError('Mic access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Upload or record a file first');
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('audioFile', file);

      const response = await fetch('https://shazam-song-recognition-api.p.rapidapi.com/recognize/file', {
        method: 'POST',
        headers: {
          'x-rapidapi-key': 'aeba2d6e6amsh2c9a9eb4c81a4e2p179ef2jsnfaff651b873a',
          'x-rapidapi-host': 'shazam-song-recognition-api.p.rapidapi.com',
        },
        body: formData,
      });

      if (!response.ok) throw new Error('API call failed');
      const data = await response.json();
      setResult(data);
      setSuccess(true);

      // ✅ Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      setError('Song detection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Search1 />
      <div className="pl-[160px] pt-[80px] pb-[30px] text-4xl font-bold flex items-center gap-2">
        <h1 className="pr-[300px]">
          Name Songs in <br />
          <span className="mt-1 block">seconds</span>
        </h1>
        <img src={Image.src} alt="banner" className="w-[480px] h-[280px]" />
      </div>

      <div className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 border p-6 rounded-md">
            <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center gap-2">
              {file && !isRecording && !audioURL ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  {file.name}
                </span>
              ) : (
                <>
                  <Upload className="h-8 w-8" />
                  <p className="font-medium text-white">Click to upload audio file</p>
                </>
              )}
              <input type="file" id="audio-upload" accept="audio/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div className="flex-1 border p-4 rounded-md text-center">
            {isRecording ? (
              <button onClick={stopRecording} className="bg-red-600 text-white px-4 py-2 rounded-full">
                <Square /> Stop
              </button>
            ) : (
              <div className="text-center mb-2">
                <button onClick={startRecording} className="font-medium text-white">
                  <br />
                  <center><big><Mic /></big> </center>Recognise through live audio recording
                </button>
              </div>
            )}
            <div className="mt-2">
              {isRecording ? `Recording... ${formatTime(recordingDuration)}` : audioURL && 'Recording ready'}
              {conversionStatus && <p className="text-blue-300 text-sm">{conversionStatus}</p>}
              {audioURL && <audio controls src={audioURL} className="mt-2 w-full max-w-xs" />}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={!file || loading || isConverting}
            className="w-full bg-blue-500 py-3 rounded-md flex items-center justify-center gap-2"
          >
            {loading ? <Animation /> : isConverting ? <Loader2 className="animate-spin" /> : <Music />}
            {loading ? 'Detecting...' : isConverting ? conversionStatus : 'Detect Song'}
          </button>
        </form>

        {error && (
          <div className="bg-red-500 p-4 rounded-md flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && result?.track && (
          <div
            ref={resultRef}  // ✅ Attach ref here
            className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-black text-white font-serif relative overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto py-10 px-6">
              <div className="inline-block py-1 px-3 bg-emerald-700 text-emerald-100 rounded-full text-sm mb-8">
                Song Detected!
              </div>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="aspect-square relative rounded-lg overflow-hidden shadow-2xl">
                  <img
                    src={result.track.images?.coverart}
                    alt={result.track.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div>
                  <h1 className="font-serif text-5xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">
                    {result.track.title}
                  </h1>
                  <p className="text-xl text-gray-300 mb-8">{result.track.subtitle}</p>
                  <div className="grid grid-cols-2 gap-6 mb-12">
                    <div>
                      <h3 className="text-lg uppercase tracking-wider text-gray-400 mb-2">Album</h3>
                      <p className="font-medium text-base text-gray-200">
                        {result.track.sections?.[0]?.metadata?.find(m => m.title === 'Album')?.text || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg uppercase tracking-wider text-gray-400 mb-2">Label</h3>
                      <p className="font-medium text-base text-gray-200">
                        {result.track.sections?.[0]?.metadata?.find(m => m.title === 'Label')?.text || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg uppercase tracking-wider text-gray-400 mb-2">Released</h3>
                      <p className="font-medium text-base text-gray-200">
                        {result.track.sections?.[0]?.metadata?.find(m => m.title === 'Released')?.text || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {platforms.map((platform) => (
                      <a
                        key={platform}
                        href={generateSearchLink(platform, result.track.title, result.track.subtitle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-48"
                      >
                        <button className="w-full px-4 py-3 bg-gradient-to-b from-gray-900 to-black hover:from-orange-400 hover:to-orange-500 rounded-md transition-all duration-300 flex items-center justify-center gap-2 shadow-lg">
                          <span className="font-medium text-xl">{platform}</span>
                        </button>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
