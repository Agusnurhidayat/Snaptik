import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/video-metadata', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL TikTok wajib diisi' });
  }

  const apiKey = process.env.RAPIDAPI_KEY ? process.env.RAPIDAPI_KEY.trim() : '';
  if (!apiKey) {
    return res.status(500).json({ error: 'RAPIDAPI_KEY kosong atau file .env tidak terbaca!' });
  }

  try {
    const response = await axios.get('https://rapidapi.com', {
      params: {
        url: url,
        hd: '1'
      },
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': '://rapidapi.com'
      }
    });

    const result = response.data;

    if (result.code === 0 && result.data) {
      return res.json({
        success: true,
        id: result.data.id,
        title: result.data.title,
        cover: result.data.cover,
        author: result.data.author?.nickname || 'TikTok User',
        video_hd: result.data.hdplay || result.data.play,
        video_sd: result.data.play,
        audio: result.data.music
      });
    } else {
      return res.status(400).json({
        error: result.message || result.msg || 'Gagal mengambil video dari RapidAPI'
      });
    }
  } catch (error) {
    console.error('Axios Error:', error.message);
    // Menampilkan detail error asli dari RapidAPI atau jaringan
    const detail = error.response?.data?.message || error.cause?.message || error.message;
    return res.status(500).json({
      error: `Error: ${detail}`
    });
  }
});

app.listen(3000, () => console.log('Server berjalan di http://localhost:3000'));
