const express = require('express');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const session = require('express-session');
const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(session({ secret: 'toxic_green_secret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// 1. ТУТ ВСТАВЬ СВОЙ КЛЮЧ: https://steamcommunity.com
const STEAM_API_KEY = '1234567890QWERTYUIOPASDFGHJKLZXC'; 

// 2. ТВОЙ АДРЕС НА RENDER
const DOMAIN = 'https://green-case.onrender.com'; 

let users = {};
let liveDrops = [];

const ITEMS = [
    { name: 'M9 Bayonet | Gamma Doppler', price: 45000, rarity: 'gold', chance: 0.5, img: 'https://community.cloudflare.steamstatic.com' },
    { name: 'AK-47 | Ice Coaled', price: 1200, rarity: 'classified', chance: 15, img: 'https://community.akamai.steamstatic.com' },
    { name: 'P250 | Sand Dune', price: 5, rarity: 'mil-spec', chance: 84.5, img: 'https://community.akamai.steamstatic.com' }
];

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, users[id]));

passport.use(new SteamStrategy({
    returnURL: `${DOMAIN}/auth/steam/return`,
    realm: `${DOMAIN}/`,
    apiKey: STEAM_API_KEY
}, (identifier, profile, done) => {
    const sid = profile._json.steamid;
    if (!users[sid]) {
        users[sid] = { 
            id: sid, 
            name: profile.displayName, 
            avatar: profile._json.avatarfull, 
            balance: 1000, 
            inventory: [] 
        };
    }
    return done(null, users[sid]);
}));

app.get('/', (req, res) => res.render('index', { user: req.user, items: ITEMS, drops: liveDrops }));
app.get('/auth/steam', passport.authenticate('steam'));
app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), (req, res) => res.redirect('/'));

app.post('/open', (req, res) => {
    if (!req.user || req.user.balance < 100) return res.json({ error: 'Баланс!' });
    
    let rand = Math.random() * 100, cum = 0, win = ITEMS[ITEMS.length-1];
    for (let i of ITEMS) { 
        cum += i.chance; 
        if (rand <= cum) { win = i; break; } 
    }
    
    req.user.balance -= 100;
    const dropItem = { ...win, iid: Date.now() };
    req.user.inventory.push(dropItem);
    
    liveDrops.unshift({ img: win.img });
    if (liveDrops.length > 12) liveDrops.pop();
    
    res.json({ win: dropItem, balance: req.user.balance });
});

// Запуск сервера на порту, который выдаст Render
app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running!');
});
