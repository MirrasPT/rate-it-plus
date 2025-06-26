// rateitplus_backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Para gerar tokens

const app = express();
const port = process.env.PORT || 3001;

// Chave secreta para JWT - NUMA APLICAÇÃO REAL, ISTO DEVE ESTAR NUM FICHEIRO .ENV E SER MAIS COMPLEXO
const JWT_SECRET = process.env.JWT_SECRET || 'aTuaChaveSuperSecretaParaRateItPlus';


app.use(cors());
app.use(express.json());

const DB_FILE_PATH = './rateitplus_local.db';
let dbPromise;

// Pesos padrão para cálculo do score (devem corresponder ao dataManager.js)
const PESOS_PADRAO = {
  historiaEnredo: 9,
  roteiroDialogos: 6,
  construcaoMundo: 6,
  desenvolvimentoPersonagens: 8,
  musica: 6,
  efeitosSonoros: 5,
  artesVisuais: 7.5,
  impactoEmocional: 7.5,
  originalidade: 8.5,
  ritmo: 7,
  humor: 3,
  adaptacaoRemake: 3
};

// Função para calcular score final
function calcularScoreFinalBackend(classificacoes, pesos = PESOS_PADRAO) {
  if (!classificacoes || typeof classificacoes !== 'object') {
    console.warn(" calcularScoreFinalBackend: 'classificacoes' em falta ou não é um objeto. Retornando 0.");
    return 0.00;
  }
  let somaPonderada = 0;
  let somaPesos = 0;

  for (const criterio in pesos) {
    const notaRaw = classificacoes[criterio];
    if (notaRaw !== null && notaRaw !== '' && notaRaw !== undefined) {
      const nota = parseFloat(notaRaw);
      const peso = pesos[criterio];
      if (!isNaN(nota) && !isNaN(peso)) {
        somaPonderada += nota * peso;
        somaPesos += peso;
      }
    } else if (criterio === 'adaptacaoRemake' && (notaRaw === null || notaRaw === '' || notaRaw === undefined)) {
      continue;
    }
  }
  const scoreCalculado = somaPesos > 0 ? parseFloat((somaPonderada / somaPesos).toFixed(2)) : 0.00;
  return scoreCalculado;
}

async function initializeDbConnection() {
    try {
        dbPromise = open({
            filename: DB_FILE_PATH,
            driver: sqlite3.Database
        });
        const db = await dbPromise;
        await db.exec('PRAGMA foreign_keys = ON;');
        console.log('Conectado à base de dados SQLite local com sucesso! Chaves estrangeiras ativadas.');
        return db;
    } catch (error) {
        console.error('Erro ao conectar/criar base de dados SQLite:', error);
        process.exit(1);
    }
}

async function initializeDatabase(db) {
    try {
        // Tabela Utilizadores (sem alterações por agora)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS Utilizadores (
                id_utilizador INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_utilizador TEXT UNIQUE NOT NULL,
                palavra_passe_hash TEXT NOT NULL,
                data_registo TEXT DEFAULT (datetime('now','localtime'))
            );
        `);
        console.log("Tabela 'Utilizadores' (SQLite) verificada/criada com sucesso.");

        // NOVA: Tabela CriteriosPadrao
        // Objetivo: Armazenar critérios sugeridos para o onboarding de novos utilizadores.
        await db.exec(`
            CREATE TABLE IF NOT EXISTS CriteriosPadrao (
                id_criterio_padrao INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_criterio TEXT UNIQUE NOT NULL,
                descricao TEXT
            );
        `);
        console.log("Tabela 'CriteriosPadrao' (SQLite) verificada/criada com sucesso.");
        
        // Popular a tabela de critérios padrão apenas se estiver vazia (para evitar duplicados)
        const count = await db.get('SELECT COUNT(*) as count FROM CriteriosPadrao');
        if (count.count === 0) {
            const criterios = [
                'História & Enredo', 'Roteiro / Diálogos', 'Construção de Mundo', 
                'Desenvolvimento de Personagens', 'Música', 'Efeitos Sonoros', 
                'Artes Visuais', 'Impacto Emocional', 'Originalidade', 'Ritmo', 'Humor',
                'Adaptação/Remake'
            ];
            const stmt = await db.prepare('INSERT INTO CriteriosPadrao (nome_criterio) VALUES (?)');
            for (const nome of criterios) {
                await stmt.run(nome);
            }
            await stmt.finalize();
            console.log("Tabela 'CriteriosPadrao' populada com valores iniciais.");
        }

        // NOVA: Tabela CriteriosUtilizador
        // Objetivo: Guardar os critérios e pesos personalizados para cada utilizador.
        await db.exec(`
            CREATE TABLE IF NOT EXISTS CriteriosUtilizador (
                id_criterio_utilizador INTEGER PRIMARY KEY AUTOINCREMENT,
                id_utilizador INTEGER NOT NULL,
                nome_criterio TEXT NOT NULL,
                peso REAL NOT NULL DEFAULT 5,
                FOREIGN KEY (id_utilizador) REFERENCES Utilizadores(id_utilizador) ON DELETE CASCADE
            );
        `);
        console.log("Tabela 'CriteriosUtilizador' (SQLite) verificada/criada com sucesso.");
        
        // Tabela ItensMedia (sem alterações)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS ItensMedia (
                id TEXT PRIMARY KEY,
                id_utilizador INTEGER, 
                tmdb_id TEXT,
                nome TEXT NOT NULL,
                tipo TEXT,
                url_imagem TEXT,
                ano_lancamento INTEGER,
                trailer_url TEXT,
                idioma_original TEXT,
                sinopse TEXT,
                review_pessoal TEXT,
                score_final_calculado REAL,
                data_adicao TEXT DEFAULT (datetime('now','localtime')),
                data_ultima_modificacao TEXT,
                FOREIGN KEY (id_utilizador) REFERENCES Utilizadores(id_utilizador) ON DELETE CASCADE
            );
        `);
        console.log("Tabela 'ItensMedia' (SQLite) verificada/criada.");

        // MODIFICADA: Tabela Avaliacoes
        // Objetivo: Ligar a nota a um critério específico do utilizador, em vez de um texto genérico.
        await db.exec(`
            CREATE TABLE IF NOT EXISTS Avaliacoes (
                id_avaliacao INTEGER PRIMARY KEY AUTOINCREMENT,
                id_item TEXT NOT NULL,
                id_criterio_utilizador INTEGER NOT NULL, -- Modificado de "criterio TEXT"
                nota REAL,
                FOREIGN KEY (id_item) REFERENCES ItensMedia(id) ON DELETE CASCADE,
                FOREIGN KEY (id_criterio_utilizador) REFERENCES CriteriosUtilizador(id_criterio_utilizador) ON DELETE CASCADE
            );
        `);
        console.log("Tabela 'Avaliacoes' (SQLite) verificada/modificada com sucesso.");

        // Tabela GenerosItem (sem alterações)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS GenerosItem (
                id_genero_item INTEGER PRIMARY KEY AUTOINCREMENT,
                id_item TEXT NOT NULL,
                genero TEXT NOT NULL,
                FOREIGN KEY (id_item) REFERENCES ItensMedia(id) ON DELETE CASCADE
            );
        `);
        console.log("Tabela 'GenerosItem' (SQLite) verificada/criada com sucesso.");
        
        // Tabela RelacionadosItem (sem alterações)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS RelacionadosItem (
                id_relacionado_item INTEGER PRIMARY KEY AUTOINCREMENT,
                item1_id TEXT NOT NULL,
                item2_id TEXT NOT NULL,
                FOREIGN KEY (item1_id) REFERENCES ItensMedia(id) ON DELETE CASCADE,
                FOREIGN KEY (item2_id) REFERENCES ItensMedia(id) ON DELETE CASCADE,
                UNIQUE (item1_id, item2_id) 
            );
        `);
        console.log("Tabela 'RelacionadosItem' (SQLite) verificada/criada com sucesso.");

    } catch (error) {
        console.error("Erro ao inicializar as tabelas (SQLite):", error);
        throw error;
    }
}

// --- Middleware de Autenticação (Exemplo) ---
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (token == null) return res.sendStatus(401); // Não autorizado (sem token)

    jwt.verify(token, JWT_SECRET, (err, utilizador) => {
        if (err) {
            console.error("Erro ao verificar token:", err.message);
            return res.sendStatus(403); // Proibido (token inválido)
        }
        req.utilizador = utilizador; // Adiciona os dados do utilizador ao objeto req
        // console.log("Token verificado, utilizador:", req.utilizador); // Log pode ser verboso
        next(); // Passa para a próxima função/rota
    });
}



// --- Rotas de Autenticação e Onboarding ---

app.post('/api/auth/registo', async (req, res) => {
    const { nome_utilizador, palavra_passe } = req.body;
    // console.log(`POST /api/auth/registo - Recebido: ${nome_utilizador}`); // Log pode ser verboso

    if (!nome_utilizador || !palavra_passe) {
        return res.status(400).json({ message: 'Nome de utilizador e palavra-passe são obrigatórios.' });
    }
    if (palavra_passe.length < 6) { // Exemplo de validação de password
        return res.status(400).json({ message: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
    }


    const db = await dbPromise;
    try {
        const utilizadorExistente = await db.get('SELECT * FROM Utilizadores WHERE nome_utilizador = ?', nome_utilizador);
        if (utilizadorExistente) {
            return res.status(409).json({ message: 'Nome de utilizador já existe.' });
        }

        const saltRounds = 10;
        const palavraPasseHash = await bcrypt.hash(palavra_passe, saltRounds);
        
        const result = await db.run(
            'INSERT INTO Utilizadores (nome_utilizador, palavra_passe_hash) VALUES (?, ?)',
            [nome_utilizador, palavraPasseHash]
        );
        
        res.status(201).json({ message: 'Utilizador registado com sucesso!', id_utilizador: result.lastID, nome_utilizador });

    } catch (error) {
        console.error('Erro no registo:', error);
        res.status(500).json({ message: `Erro ao registar utilizador: ${error.message}` });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { nome_utilizador, palavra_passe } = req.body;
    // console.log(`POST /api/auth/login - Tentativa de login para: ${nome_utilizador}`); // Log pode ser verboso

    if (!nome_utilizador || !palavra_passe) {
        return res.status(400).json({ message: 'Nome de utilizador e palavra-passe são obrigatórios.' });
    }

    const db = await dbPromise;
    try {
        const utilizador = await db.get('SELECT * FROM Utilizadores WHERE nome_utilizador = ?', nome_utilizador);
        if (!utilizador) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const match = await bcrypt.compare(palavra_passe, utilizador.palavra_passe_hash);
        if (match) {
            const accessToken = jwt.sign(
                { id_utilizador: utilizador.id_utilizador, nome_utilizador: utilizador.nome_utilizador },
                JWT_SECRET,
                { expiresIn: '1h' } 
            );
            res.json({ 
                message: 'Login bem-sucedido!', 
                accessToken, 
                id_utilizador: utilizador.id_utilizador, 
                nome_utilizador: utilizador.nome_utilizador 
            });
        } else {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: `Erro ao fazer login: ${error.message}` });
    }
});

// ROTA: Obter os critérios padrão para sugestão no frontend
app.get('/api/criterios-padrao', async (req, res) => {
    try {
        const db = await dbPromise;
        const criterios = await db.all('SELECT id_criterio_padrao, nome_criterio FROM CriteriosPadrao ORDER BY nome_criterio');
        res.json(criterios);
    } catch (error) {
        console.error('Erro ao obter critérios padrão:', error);
        res.status(500).json({ message: 'Erro ao obter dados dos critérios.' });
    }
});

// ROTA: Registar um novo utilizador com os seus critérios personalizados
app.post('/api/auth/registo-completo', async (req, res) => {
    const { nome_utilizador, palavra_passe, criterios } = req.body;

    if (!nome_utilizador || !palavra_passe || !criterios || !Array.isArray(criterios) || criterios.length === 0) {
        return res.status(400).json({ message: 'Dados incompletos. É necessário nome de utilizador, palavra-passe e uma lista de critérios.' });
    }
    if (palavra_passe.length < 6) {
        return res.status(400).json({ message: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
    }

    const db = await dbPromise;
    try {
        const utilizadorExistente = await db.get('SELECT * FROM Utilizadores WHERE nome_utilizador = ?', nome_utilizador);
        if (utilizadorExistente) {
            return res.status(409).json({ message: 'Este nome de utilizador já está a ser utilizado.' });
        }

        await db.run('BEGIN TRANSACTION');

        const saltRounds = 10;
        const palavraPasseHash = await bcrypt.hash(palavra_passe, saltRounds);
        
        const resultUtilizador = await db.run(
            'INSERT INTO Utilizadores (nome_utilizador, palavra_passe_hash) VALUES (?, ?)',
            [nome_utilizador, palavraPasseHash]
        );
        const novoIdUtilizador = resultUtilizador.lastID;

        const stmtCriterio = await db.prepare(
            'INSERT INTO CriteriosUtilizador (id_utilizador, nome_criterio, peso) VALUES (?, ?, ?)'
        );
        
        for (const criterio of criterios) {
            if (!criterio.nome_criterio || criterio.peso === undefined) {
                await db.run('ROLLBACK');
                return res.status(400).json({ message: `Critério inválido fornecido: ${JSON.stringify(criterio)}` });
            }
            await stmtCriterio.run(novoIdUtilizador, criterio.nome_criterio, criterio.peso);
        }
        await stmtCriterio.finalize();

        await db.run('COMMIT');

        res.status(201).json({ 
            message: 'Utilizador e critérios registados com sucesso!', 
            id_utilizador: novoIdUtilizador,
            nome_utilizador: nome_utilizador 
        });

    } catch (error) {
        await db.run('ROLLBACK');
        console.error('Erro no registo completo:', error);
        res.status(500).json({ message: `Erro ao registar utilizador: ${error.message}` });
    }
});


// --- Rotas da API Coleção ---

app.get('/api/colecao', verificarToken, async (req, res) => {
    const id_utilizador_logado = req.utilizador.id_utilizador;
    try {
        const db = await dbPromise;
        const rows = await db.all(
            'SELECT id, nome, tipo, url_imagem, ano_lancamento, score_final_calculado, sinopse FROM ItensMedia WHERE id_utilizador = ? ORDER BY score_final_calculado DESC, nome ASC',
            [id_utilizador_logado]
        );
        res.json(rows);
    } catch (error) {
        console.error('Erro ao obter coleção (SQLite):', error);
        res.status(500).json({ message: 'Erro ao obter dados da coleção.' });
    }
});

// Dentro do ficheiro Rate_It_Plus/rateitplus_backend/server.js

app.get('/api/colecao/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const id_utilizador_logado = req.utilizador.id_utilizador;
    console.log(`[BACKEND LOG] Iniciando GET /api/colecao/${id} para utilizador ${id_utilizador_logado}`); // Log de início

    try {
        const db = await dbPromise;
        console.log(`[BACKEND LOG] Obtendo item principal da DB para id: ${id}`); // Log antes da query principal
        const itemRow = await db.get('SELECT * FROM ItensMedia WHERE id = ? AND id_utilizador = ?', [id, id_utilizador_logado]);
        
        if (itemRow) {
            console.log(`[BACKEND LOG] Item principal encontrado:`, itemRow); // Log se itemRow for encontrado

            console.log(`[BACKEND LOG] Obtendo avaliações da DB para id_item: ${id}`);
            const avaliacoesRows = await db.all('SELECT criterio, nota FROM Avaliacoes WHERE id_item = ?', id);
            const classificacoes = {};
            avaliacoesRows.forEach(row => { classificacoes[row.criterio] = row.nota; });
            console.log(`[BACKEND LOG] Avaliações processadas:`, classificacoes);

            console.log(`[BACKEND LOG] Obtendo géneros da DB para id_item: ${id}`);
            const generosRows = await db.all('SELECT genero FROM GenerosItem WHERE id_item = ?', id);
            const generos = generosRows.map(row => row.genero);
            console.log(`[BACKEND LOG] Géneros processados:`, generos);
            
            console.log(`[BACKEND LOG] Obtendo relacionados da DB para id_item: ${id}`);
            const relacionadosRows = await db.all(`
                SELECT CASE WHEN item1_id = ? THEN item2_id ELSE item1_id END as id_relacionado
                FROM RelacionadosItem WHERE item1_id = ? OR item2_id = ?`, 
                [id, id, id]
            );
            const relacionados = relacionadosRows.map(row => row.id_relacionado);
            console.log(`[BACKEND LOG] Relacionados processados:`, relacionados);

            const itemCompleto = { ...itemRow, classificacoes, generos, relacionados }; // Alterado de 'genero' para 'generos'
            console.log(`[BACKEND LOG] Item completo montado. Enviando resposta.`);
            res.json(itemCompleto);
        } else {
            console.log(`[BACKEND LOG] Item com id: ${id} não encontrado para utilizador ${id_utilizador_logado}. Enviando 404.`);
            res.status(404).json({ message: 'Item não encontrado ou não pertence ao utilizador.' });
        }

    } catch (error) { // Este catch irá apanhar erros das queries ou do processamento
        console.error(`[BACKEND ERROR] Erro detalhado ao obter item ${id} (SQLite):`, error); // Log do erro completo no backend
        res.status(500).json({ message: 'Erro ao obter dados do item.' });
    }
});

app.post('/api/colecao', verificarToken, async (req, res) => {
    const id_utilizador_logado = req.utilizador.id_utilizador;
    // console.log(`POST /api/colecao - Utilizador ID: ${id_utilizador_logado}, req.body:`, JSON.stringify(req.body, null, 2)); // Log pode ser verboso
    const { 
        id, tmdb_id, nome, tipo, urlImagem, anoLancamento, trailerUrl, 
        idioma, sinopse, review, classificacoes, genero, relacionados 
    } = req.body;

    // ADICIONE ESTE LOG:
console.log(`[BACKEND POST /api/colecao] Géneros recebidos no req.body.genero:`, genero);


    if (!id || !nome || !classificacoes) { 
        return res.status(400).json({ message: 'Dados incompletos (id, nome, classificacoes são obrigatórios).' });
    }

    const scoreFinalCalculado = calcularScoreFinalBackend(classificacoes);
    const dataAtual = new Date().toISOString();
    const db = await dbPromise;

    try {
        await db.run('BEGIN TRANSACTION');
        const queryItem = `
            INSERT INTO ItensMedia
            (id, id_utilizador, tmdb_id, nome, tipo, url_imagem, ano_lancamento, trailer_url, idioma_original, sinopse, review_pessoal, score_final_calculado, data_ultima_modificacao, data_adicao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'));
        `;
        await db.run(queryItem, [
            id, id_utilizador_logado, tmdb_id, nome, tipo, urlImagem, anoLancamento, trailerUrl, idioma, 
            sinopse, review, scoreFinalCalculado, dataAtual
        ]);
        
        if (classificacoes && typeof classificacoes === 'object') {
            for (const [criterio, nota] of Object.entries(classificacoes)) {
                if (nota !== null && nota !== undefined && nota !== '') {
                    await db.run('INSERT INTO Avaliacoes (id_item, criterio, nota) VALUES (?, ?, ?)', [id, criterio, parseFloat(nota)]);
                }
            }
        }
        if (genero && Array.isArray(genero)) {
            for (const g of genero) {
                await db.run('INSERT INTO GenerosItem (id_item, genero) VALUES (?, ?)', [id, g]);
            }
        }
        if (relacionados && Array.isArray(relacionados)) {
            for (const relacionadoId of relacionados) {
                if (id === relacionadoId) continue;
                const [item1_id, item2_id] = [id, relacionadoId].sort();
                try {
                    await db.run('INSERT INTO RelacionadosItem (item1_id, item2_id) VALUES (?, ?)', [item1_id, item2_id]);
                } catch (e) { if (e.code !== 'SQLITE_CONSTRAINT') throw e; }
            }
        }
        await db.run('COMMIT');
        
        const itemAdicionadoParaResposta = { 
            id_utilizador: id_utilizador_logado, id, tmdb_id, nome, tipo, 
            url_imagem: urlImagem, ano_lancamento: anoLancamento, trailer_url: trailerUrl,
            idioma_original: idioma, sinopse, review_pessoal: review,
            score_final_calculado: scoreFinalCalculado, data_ultima_modificacao: dataAtual, 
            data_adicao: new Date().toISOString(), 
            classificacoes, genero, relacionados: relacionados || []
        };
        res.status(201).json({ message: 'Item adicionado com sucesso!', item: itemAdicionadoParaResposta });

    } catch (error) { 
        console.error('Erro ao adicionar item completo (SQLite):', error);
        await db.run('ROLLBACK');
        res.status(500).json({ message: `Erro ao adicionar item à base de dados: ${error.message}` });
     }
});

app.put('/api/colecao/:id', verificarToken, async (req, res) => {
    const { id: itemIdFromParams } = req.params;
    const id_utilizador_logado = req.utilizador.id_utilizador;
    // console.log(`PUT /api/colecao/:id - ID do URL: ${itemIdFromParams}, Utilizador ID: ${id_utilizador_logado}`); // Log pode ser verboso
    // console.log(`PUT /api/colecao/:id - req.body recebido:`, JSON.stringify(req.body, null, 2)); // Log pode ser verboso
    
    const db = await dbPromise;
    const itemExistente = await db.get('SELECT id_utilizador FROM ItensMedia WHERE id = ?', itemIdFromParams);
    if (!itemExistente) {
        return res.status(404).json({ message: 'Item não encontrado.' });
    }
    if (itemExistente.id_utilizador !== id_utilizador_logado) {
        return res.status(403).json({ message: 'Acesso não autorizado a este item.' });
    }

    const { 
        id: idFromBody, tmdb_id, nome, tipo, urlImagem, anoLancamento, trailerUrl, 
        idioma, sinopse, review, classificacoes, genero, relacionados 
    } = req.body;


    console.log(`[BACKEND PUT /api/colecao/${itemIdFromParams}] Géneros recebidos no req.body.genero:`, genero);


    if (itemIdFromParams !== idFromBody) { 
        return res.status(400).json({ message: 'IDs do item no URL e no corpo não correspondem.'});
    }
    if (!nome || !classificacoes) { 
        return res.status(400).json({ message: 'Nome e classificações são obrigatórios para atualização.' });
    }

    const scoreFinalCalculado = calcularScoreFinalBackend(classificacoes);
    const dataAtual = new Date().toISOString();

    try {
        await db.run('BEGIN TRANSACTION');
        const queryItem = `
            UPDATE ItensMedia SET
                tmdb_id = ?, nome = ?, tipo = ?, url_imagem = ?, ano_lancamento = ?,
                trailer_url = ?, idioma_original = ?, sinopse = ?, review_pessoal = ?,
                score_final_calculado = ?, data_ultima_modificacao = ?
            WHERE id = ? AND id_utilizador = ?; 
        `;
        const updateResult = await db.run(queryItem, [
            tmdb_id, nome, tipo, urlImagem, anoLancamento, trailerUrl, idioma, sinopse, review,
            scoreFinalCalculado, dataAtual, itemIdFromParams, id_utilizador_logado
        ]);

        if (updateResult.changes === 0 && itemExistente) { // Se o item existia mas não foi alterado (ou não pertence ao user - já verificado)
             // Não necessariamente um erro se os dados forem idênticos, mas o id_utilizador já foi verificado
            console.warn(`PUT /api/colecao/:id - Nenhum registo atualizado em ItensMedia para ID: ${itemIdFromParams}. Os dados podem ser idênticos.`);
        }
        
        await db.run('DELETE FROM Avaliacoes WHERE id_item = ?', itemIdFromParams);
        if (classificacoes && typeof classificacoes === 'object') { 
            for (const [criterio, nota] of Object.entries(classificacoes)) {
                if (nota !== null && nota !== undefined && nota !== '') {
                    await db.run('INSERT INTO Avaliacoes (id_item, criterio, nota) VALUES (?, ?, ?)', [itemIdFromParams, criterio, parseFloat(nota)]);
                }
            }
        }
        await db.run('DELETE FROM GenerosItem WHERE id_item = ?', itemIdFromParams);
        if (genero && Array.isArray(genero)) { 
            for (const g of genero) {
                await db.run('INSERT INTO GenerosItem (id_item, genero) VALUES (?, ?)', [itemIdFromParams, g]);
            }
         }
        await db.run('DELETE FROM RelacionadosItem WHERE item1_id = ? OR item2_id = ?', [itemIdFromParams, itemIdFromParams]);
        if (relacionados && Array.isArray(relacionados)) { 
            for (const relacionadoId of relacionados) {
                if (itemIdFromParams === relacionadoId) continue;
                const [item1_id, item2_id] = [itemIdFromParams, relacionadoId].sort();
                try {
                    await db.run('INSERT INTO RelacionadosItem (item1_id, item2_id) VALUES (?, ?)', [item1_id, item2_id]);
                } catch (e) { if (e.code !== 'SQLITE_CONSTRAINT') throw e; }
            }
        }

        await db.run('COMMIT');
        
        const itemAtualizadoParaResposta = {
            id_utilizador: id_utilizador_logado, id: itemIdFromParams, tmdb_id, nome, tipo, 
            url_imagem: urlImagem, ano_lancamento: anoLancamento, trailer_url: trailerUrl,
            idioma_original: idioma, sinopse, review_pessoal: review,
            score_final_calculado: scoreFinalCalculado, data_ultima_modificacao: dataAtual,
            classificacoes, genero, relacionados: relacionados || []
        };
        res.json({ message: 'Item atualizado com sucesso!', item: itemAtualizadoParaResposta });

    } catch (error) { 
        console.error(`Erro ao atualizar item ${itemIdFromParams} (SQLite):`, error);
        await db.run('ROLLBACK');
        res.status(500).json({ message: `Erro ao atualizar item: ${error.message}` });
     }
});

app.delete('/api/colecao/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const id_utilizador_logado = req.utilizador.id_utilizador;
    const db = await dbPromise;
    
    try {
        const itemExistente = await db.get('SELECT id_utilizador FROM ItensMedia WHERE id = ?', id);
        if (!itemExistente) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        if (itemExistente.id_utilizador !== id_utilizador_logado) {
            return res.status(403).json({ message: 'Acesso não autorizado a eliminar este item.' });
        }
        
        const result = await db.run('DELETE FROM ItensMedia WHERE id = ? AND id_utilizador = ?', [id, id_utilizador_logado]);
        
        if (result.changes > 0) {
            res.json({ message: 'Item eliminado com sucesso!', id: id });
        } else {
            res.status(404).json({ message: 'Item não encontrado ou não pertence ao utilizador para eliminar.' });
        }
    } catch (error) { 
        console.error(`Erro ao eliminar item ${id} (SQLite):`, error);
        res.status(500).json({ message: 'Erro ao eliminar item.' });
    }
});


async function startServer() {
    const db = await initializeDbConnection();
    await initializeDatabase(db);

    app.listen(port, () => {
        console.log(`Servidor Rate It Plus (com SQLite e Auth) a correr em http://localhost:${port}`);
    });
}

startServer();