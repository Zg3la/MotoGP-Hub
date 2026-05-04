const Datastore = require('@seald-io/nedb');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../db');

const db = {
  users:    new Datastore({ filename: path.join(dbPath, 'users.db'),    autoload: true }),
  posts:    new Datastore({ filename: path.join(dbPath, 'posts.db'),    autoload: true }),
  comments: new Datastore({ filename: path.join(dbPath, 'comments.db'), autoload: true }),
  likes:    new Datastore({ filename: path.join(dbPath, 'likes.db'),    autoload: true }),
  follows:  new Datastore({ filename: path.join(dbPath, 'follows.db'),  autoload: true }),
};

db.users.ensureIndex({ fieldName: 'username', unique: true });
db.users.ensureIndex({ fieldName: 'email',    unique: true });
db.likes.ensureIndex({ fieldName: 'postId' });
db.follows.ensureIndex({ fieldName: 'followerId' });

// helpers
function bcryptHash(pw) {
  return new Promise((res, rej) => bcrypt.hash(pw, 10, (e, h) => e ? rej(e) : res(h)));
}
function hrs(n) { return n * 3600000; }

function mkPost(user, status, content, ts) {
  return {
    userId: user._id, username: user.username,
    authorName: user.name, authorAvatar: user.avatar,
    authorAvatarColor: user.avatarColor, authorRole: user.role,
    content, status,
    likes: 0, dislikes: 0, commentCount: 0,
    createdAt: new Date(ts)
  };
}
function mkComment(user, postDoc, content, ts) {
  return {
    postId: postDoc._id, userId: user._id, username: user.username,
    authorName: user.name, authorAvatar: user.avatar,
    authorAvatarColor: user.avatarColor,
    content, createdAt: new Date(ts)
  };
}
function mkLike(user, postDoc, type) {
  return { postId: postDoc._id, userId: user._id, type, createdAt: new Date() };
}
function mkFollow(follower, target) {
  return { followerId: follower._id, followingId: target._id, createdAt: new Date() };
}

async function seedDatabase() {
  return new Promise((resolve) => {
    db.users.count({}, async (err, count) => {
      if (err)     { console.error('DB count error:', err); return resolve(); }
      if (count > 0) { console.log('✅ Database already seeded'); return resolve(); }

      console.log('🌱 Seeding database...');

      const driverHash = await bcryptHash('motogp123');
      const fanHash    = await bcryptHash('fan123');
      const adminHash  = await bcryptHash('admin123');

      const usersToInsert = [
        // Admin
        { username:'admin', name:'Administrator', email:'admin@motogp.com', password:adminHash,
          role:'admin', avatar:'AD', avatarColor:'#7C3AED', bio:'MotoGP Social Hub administrator.', followers:0, createdAt:new Date() },
        // Drivers
        { username:'fabio_quartararo', name:'Fabio Quartararo', email:'fabio@motogp.com', password:driverHash,
          role:'driver', number:20, team:'Monster Energy Yamaha', nationality:'French',
          bio:'MotoGP World Champion 2021. Known as "El Diablo". Racing for Yamaha with passion and speed.',
          avatar:'FQ', avatarColor:'#FFD700', followers:0, createdAt:new Date() },
        { username:'pedro_acosta', name:'Pedro Acosta', email:'pedro@motogp.com', password:driverHash,
          role:'driver', number:31, team:'Red Bull KTM Factory Racing', nationality:'Spanish',
          bio:'The Shark of Murcia. MotoGP rookie sensation, rising star of the paddock riding for Red Bull KTM.',
          avatar:'PA', avatarColor:'#FF6600', followers:0, createdAt:new Date() },
        { username:'marc_marquez', name:'Marc Márquez', email:'marc@motogp.com', password:driverHash,
          role:'driver', number:93, team:'Gresini Racing MotoGP', nationality:'Spanish',
          bio:'8-time World Champion. The most successful rider of his generation. Fearless and relentless.',
          avatar:'MM', avatarColor:'#CC0000', followers:0, createdAt:new Date() },
        { username:'jorge_martin', name:'Jorge Martín', email:'jorge@motogp.com', password:driverHash,
          role:'driver', number:89, team:'Prima Pramac Racing', nationality:'Spanish',
          bio:'Speed king on the Desmosedici. Sprint race specialist and title contender.',
          avatar:'JM', avatarColor:'#0099FF', followers:0, createdAt:new Date() },
        // Fans
        { username:'speedfreak99', name:'Alex Turner', email:'alex@fans.com', password:fanHash,
          role:'fan', avatar:'AT', avatarColor:'#E63946',
          bio:'Lifelong MotoGP fan. Team Quartararo all the way! 🟡', followers:0, createdAt:new Date() },
        { username:'yamaha_girl', name:'Sofia Rossi', email:'sofia@fans.com', password:fanHash,
          role:'fan', avatar:'SR', avatarColor:'#2A9D8F',
          bio:'Italian MotoGP fan. Grew up watching Valentino, now cheering for the new generation.', followers:0, createdAt:new Date() },
        { username:'ktm_fan_31', name:'Marco Diaz', email:'marco@fans.com', password:fanHash,
          role:'fan', avatar:'MD', avatarColor:'#F4A261',
          bio:'Pedro Acosta believer since Moto3. The Shark is going to the top! 🦈', followers:0, createdAt:new Date() },
      ];

      db.users.insert(usersToInsert, async (err, U) => {
        if (err) { console.error('❌ User seed error:', err); return resolve(); }
        console.log('✅ Users seeded:', U.length);

        const fabio = U.find(u => u.username === 'fabio_quartararo');
        const pedro = U.find(u => u.username === 'pedro_acosta');
        const marc  = U.find(u => u.username === 'marc_marquez');
        const jorge = U.find(u => u.username === 'jorge_martin');
        const alex  = U.find(u => u.username === 'speedfreak99');
        const sofia = U.find(u => u.username === 'yamaha_girl');
        const marco = U.find(u => u.username === 'ktm_fan_31');

        const now = Date.now();
        const postsToInsert = [
          // Approved
          mkPost(fabio,'approved','🏁 Just finished a perfect lap in qualifying! The bike feels incredible this weekend. Let\'s go for pole position tomorrow! #MotoGP #ElDiablo', now - hrs(1)),
          mkPost(pedro,'approved','🦈 Another day, another challenge. KTM and I are learning together every session. The future is very bright! #TheShark #KTM #31', now - hrs(3)),
          mkPost(marc, 'approved','💪 Back on top form! Every race is a new opportunity to show what I can do. The championship is never over until it\'s over. #93 #Marquez', now - hrs(5)),
          mkPost(jorge,'approved','🔵 Feeling incredibly fast on the Desmosedici today. The team has done an amazing job with the setup. Ready to fight at the front! #89 #SprintKing', now - hrs(8)),
          mkPost(fabio,'approved','🔥 Tough day at the office but we never give up. The Yamaha has more to give — working with engineers tonight. See you on track tomorrow! #NeverGiveUp', now - hrs(24)),
          mkPost(pedro,'approved','First time riding this circuit it felt like home already. The KTM RC16 gets better every week. Massive thanks to the whole Red Bull KTM team 🧡', now - hrs(30)),
          mkPost(marc, 'approved','They said I was finished. They said the comeback was impossible. Here we are. 😤 Racing is in my DNA and nobody can take that away. #93 #NeverQuit', now - hrs(48)),
          mkPost(alex, 'approved','Watching Fabio in qualifying was absolutely insane 😱 That lap in sector 2 was pure magic from El Diablo! #MotoGP #Quartararo20', now - hrs(2)),
          mkPost(sofia,'approved','The atmosphere at the circuit this weekend is electric! So many fans, so much passion. MotoGP is the greatest motorsport in the world 🏍️❤️', now - hrs(6)),
          mkPost(marco,'approved','Pedro Acosta is from another planet. Watching him fight the veterans like he\'s been here for years is mind-blowing. The future of MotoGP is here! 🦈', now - hrs(10)),
          // Pending (awaiting admin approval)
          mkPost(alex, 'pending','Hot take: Quartararo on the right bike could challenge for the championship again. The talent is there, it\'s all about the machine. Change my mind 🤔 #MotoGP', now - hrs(0.5)),
          mkPost(sofia,'pending','Just bought tickets for the next round! Cannot wait to see these incredible machines in person again. Who else is going? 🎟️🏁', now - hrs(1.5)),
          mkPost(marco,'pending','Acosta vs Marquez in 5 years is going to be the greatest rivalry we\'ve ever seen in MotoGP. Screenshot this. #Prediction', now - hrs(2)),
        ];

        db.posts.insert(postsToInsert, async (err, P) => {
          if (err) { console.error('❌ Posts seed error:', err); return resolve(); }
          console.log('✅ Posts seeded:', P.length);

          const ap = P.filter(p => p.status === 'approved'); // approved posts

          // Comments
          const commentsToInsert = [
            mkComment(alex,  ap[0], 'Absolute legend! That S2 time was unreal 🔥',              now - hrs(0.8)),
            mkComment(sofia, ap[0], 'El Diablo is back! The whole paddock can feel it 💛',       now - hrs(0.7)),
            mkComment(marco, ap[0], 'Amazing lap Fabio! But watch out for Acosta tomorrow 😄🦈', now - hrs(0.5)),

            mkComment(alex,  ap[1], 'The Shark strikes again! KTM made the right bet on you 🧡', now - hrs(2.5)),
            mkComment(sofia, ap[1], 'Pedro you are going to be World Champion one day! 🏆',       now - hrs(2.2)),

            mkComment(sofia, ap[2], 'Marc you are literally superhuman. Nobody comes back like you! 🔴', now - hrs(4.5)),
            mkComment(alex,  ap[2], 'This is why he is the GOAT. 8 world titles and still hungry 🐐',   now - hrs(4.2)),
            mkComment(marco, ap[2], 'Respect to Marquez, genuinely one of the greatest sportsmen ever 👏', now - hrs(4.0)),

            mkComment(alex,  ap[3], 'Jorge on a sprint race weekend = automatic podium. Incredible!',  now - hrs(7.0)),
            mkComment(marco, ap[3], 'Pramac have built something really special. Go Jorge! 💙',         now - hrs(6.8)),

            mkComment(sofia, ap[7], 'Yes!! I saw that lap live and screamed so loud 😂 Incredible!',    now - hrs(1.5)),
            mkComment(marco, ap[7], 'Sector 2 had me on my feet. Pure class 🔥',                       now - hrs(1.2)),

            mkComment(alex,  ap[8], 'MotoGP fans are the best fans in motorsport, no debate!',          now - hrs(5.0)),
            mkComment(marco, ap[8], 'Agreed! Nothing beats the atmosphere at a MotoGP race 🏍️',       now - hrs(4.8)),

            mkComment(sofia, ap[9], 'Acosta is genuinely special. Agree 100%!',                         now - hrs(9.0)),
            mkComment(alex,  ap[9], 'Reminds me of a young Marquez. Same fearlessness, same instinct.', now - hrs(8.5)),
          ];

          db.comments.insert(commentsToInsert, async (err, C) => {
            if (err) { console.error('❌ Comments seed error:', err); return resolve(); }
            console.log('✅ Comments seeded:', C.length);

            // Update commentCount
            const cntMap = {};
            C.forEach(c => { cntMap[c.postId] = (cntMap[c.postId] || 0) + 1; });
            for (const [pid, cnt] of Object.entries(cntMap)) {
              await dbUpdate(db.posts, { _id: pid }, { $set: { commentCount: cnt } });
            }

            // Likes
            const likesToInsert = [
              mkLike(alex,  ap[0],'like'), mkLike(sofia,ap[0],'like'), mkLike(marco,ap[0],'like'),
              mkLike(alex,  ap[1],'like'), mkLike(sofia,ap[1],'like'),
              mkLike(sofia, ap[2],'like'), mkLike(alex, ap[2],'like'), mkLike(marco,ap[2],'like'),
              mkLike(alex,  ap[3],'like'), mkLike(marco,ap[3],'like'),
              mkLike(alex,  ap[4],'like'), mkLike(sofia,ap[4],'like'), mkLike(marco,ap[4],'dislike'),
              mkLike(sofia, ap[5],'like'), mkLike(marco,ap[5],'like'), mkLike(alex, ap[5],'like'),
              mkLike(alex,  ap[6],'like'), mkLike(sofia,ap[6],'like'),
              mkLike(sofia, ap[7],'like'), mkLike(marco,ap[7],'like'),
              mkLike(alex,  ap[8],'like'), mkLike(marco,ap[8],'like'),
              mkLike(alex,  ap[9],'like'), mkLike(sofia,ap[9],'like'),
            ];

            db.likes.insert(likesToInsert, async (err, L) => {
              if (err) { console.error('❌ Likes seed error:', err); return resolve(); }
              console.log('✅ Likes seeded:', L.length);

              for (const lk of L) {
                const upd = lk.type === 'like' ? { $inc:{likes:1} } : { $inc:{dislikes:1} };
                await dbUpdate(db.posts, { _id: lk.postId }, upd);
              }

              // Follows
              const followsToInsert = [
                mkFollow(alex,  fabio), mkFollow(alex,  pedro),
                mkFollow(sofia, fabio), mkFollow(sofia, marc),
                mkFollow(marco, pedro), mkFollow(marco, marc),
              ];
              const fCount = {};
              followsToInsert.forEach(f => { fCount[f.followingId] = (fCount[f.followingId]||0)+1; });

              db.follows.insert(followsToInsert, async (err) => {
                if (!err) {
                  for (const [uid, cnt] of Object.entries(fCount)) {
                    await dbUpdate(db.users, { _id: uid }, { $set: { followers: cnt } });
                  }
                }
                console.log('✅ Follows seeded');
                console.log('\n🏁 Database seeding complete!');
                console.log('   Admin  → admin / admin123');
                console.log('   Driver → fabio_quartararo / motogp123');
                console.log('   Fan    → speedfreak99 / fan123\n');
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

function dbUpdate(store, query, update) {
  return new Promise(r => store.update(query, update, {}, r));
}

seedDatabase();
module.exports = db;
