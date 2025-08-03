/*
import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  FaApple,
  FaAmazon,
  FaMusic,
} from 'react-icons/fa';
import { SiJiosaavn, SiWynk, SiGaana } from 'react-icons/si';

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case 'gaana':
      return <SiGaana className="inline mr-1" />;
    case 'amazon':
      return <FaAmazon className="inline mr-1" />;
    case 'apple':
      return <FaApple className="inline mr-1" />;
    case 'jiosaavn':
      return <SiJiosaavn className="inline mr-1" />;
    case 'wynk':
      return <SiWynk className="inline mr-1" />;
    default:
      return <FaMusic className="inline mr-1" />;
  }
}

function generateSearchLink(
  platform: string,
  songName: string,
  artistName: string = ''
) {
  const query = encodeURIComponent(`${songName} ${artistName}`);

  switch (platform) {
    case 'gaana':
      return `https://gaana.com/search/${encodeURIComponent(songName)}`;
    case 'amazon':
      return `https://music.amazon.com/search/${query}`;
    case 'apple':
      return `https://music.apple.com/us/search?term=${encodeURIComponent(
        songName
      )}`;
    case 'jiosaavn':
      return `https://www.google.com/search?q=${query}+site:jiosaavn.com`;
    case 'wynk':
      return `https://www.google.com/search?q=${query}+site:wynk.in`;
    default:
      return '#';
  }
}

const platforms = ['gaana', 'amazon', 'apple', 'jiosaavn', 'wynk'];

export default function Result({ result }: { result: any }) {
  const song = result?.result?.track;
  const router = useRouter();

  useEffect(() => {
    if (!song) return;
    router.push('/result-display');
  }, [song, router]);

  if (!song) return null;

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-6 flex flex-col md:flex-row md:items-start md:space-x-8">
      <div className="flex-shrink-0">
        <Image
          src={song.images?.coverart || '/placeholder.jpg'}
          alt={song.title}
          width={600}
          height={600}
          className="rounded-md shadow-md"
        />
      </div>

      <div className="flex flex-col justify-start flex-grow mt-4 md:mt-0">
        <h2 className="text-4xl font-bold mb-2">
          {song.title}
        </h2>
        {song.subtitle && (
          <p className="text-2xl text-gray-300 mb-6">By {song.subtitle}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <a
              key={platform}
              href={generateSearchLink(platform, song.title, song.subtitle)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-start bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded transition duration-200"
            >
              {getPlatformIcon(platform)} <span className="ml-2 capitalize">Open in {platform}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

*/