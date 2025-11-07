import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize, DataTypes } from 'sequelize';

dotenv.config();
const app = express();
app.use(express.json());

// Allow multiple origins (comma-separated)
const allowList = (process.env.ALLOW_ORIGIN||'http://localhost:3000').split(',').map(s=>s.trim());
app.use(cors({
  origin: (origin, cb)=> cb(null, !origin || allowList.includes(origin)),
  credentials: false,
}));

// DB config (Docker will inject ENV; local uses .env)
const DIALECT = process.env.DB_DIALECT || 'mysql';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT||3306);
const DB_NAME = process.env.DB_NAME || 'traductor';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST, port: DB_PORT, dialect: DIALECT, logging: false,
});

const Word = sequelize.define('Word', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sourceLang: { type: DataTypes.ENUM('es','en'), allowNull: false },
  sourceText: { type: DataTypes.STRING(255), allowNull: false },
  targetText: { type: DataTypes.STRING(255), allowNull: false },
}, { tableName: 'words', indexes: [{ unique: true, fields: ['sourceLang','sourceText'] }] });

app.get('/api/health', async (_req,res)=>{
  try { await sequelize.authenticate(); res.json({ ok:true, dialect:DIALECT, host:DB_HOST, db:DB_NAME }); }
  catch(e){ res.status(500).json({ ok:false, error:e.message }); }
});

app.get('/api/words', async (req,res)=>{
  const q = (req.query.q||'').toString().toLowerCase();
  const where = q ? { sourceText: sequelize.where(sequelize.fn('LOWER', sequelize.col('sourceText')), 'LIKE', `%${q}%`) } : undefined;
  const words = await Word.findAll({ where, order:[['id','DESC']] });
  res.json(words);
});

app.get('/api/words/:id', async (req,res)=>{
  const w = await Word.findByPk(Number(req.params.id));
  if(!w) return res.status(404).json({ error:'Not found' });
  res.json(w);
});

app.post('/api/words', async (req,res)=>{
  const { sourceLang, sourceText, targetText } = req.body||{};
  if(!sourceLang || !sourceText || !targetText) return res.status(400).json({ error:'Campos requeridos' });
  try{
    const created = await Word.create({ sourceLang, sourceText, targetText });
    res.status(201).json(created);
  }catch(e){
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/words/:id', async (req,res)=>{
  const w = await Word.findByPk(Number(req.params.id));
  if(!w) return res.status(404).json({ error:'Not found' });
  const { sourceLang, sourceText, targetText } = req.body||{};
  await w.update({ sourceLang, sourceText, targetText });
  res.json(w);
});

app.delete('/api/words/:id', async (req,res)=>{
  const deleted = await Word.destroy({ where:{ id:Number(req.params.id) } });
  if(!deleted) return res.status(404).json({ error:'Not found' });
  res.json({ ok:true });
});

app.post('/api/translate', async (req,res)=>{
  const { text, direction } = req.body||{};
  if(!text) return res.status(400).json({ error:'text requerido' });
  let sourceLang = direction==='en-es'?'en':(direction==='es-en'?'es':null);
  if(!sourceLang){ sourceLang = /[áéíóúñü]|\b(el|la|de|y|no|sí|hola|gracias)\b/i.test(text) ? 'es':'en'; }
  const w = await Word.findOne({ where:{ sourceLang, sourceText:text } });
  if(!w) return res.json({ found:false, translation:null });
  res.json({ found:true, translation:w.targetText });
});

const port = Number(process.env.PORT||4000);
app.listen(port, async ()=>{
  try{
    await sequelize.authenticate();
    await sequelize.sync();
    console.log(`API lista en http://localhost:${port}`);
  }catch(e){
    console.error('Error al iniciar:', e);
  }
});
