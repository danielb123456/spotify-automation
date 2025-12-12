import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import dotenv from 'dotenv';

dotenv.config();

let spotify;

if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    spotify = SpotifyApi.withClientCredentials(
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET
    );
} else {
    console.warn("Spotify credentials not found in .env");
}

export const getSpotifyClient = () => {
    if (!spotify) {
        throw new Error("Spotify client not initialized.");
    }
    return spotify;
};