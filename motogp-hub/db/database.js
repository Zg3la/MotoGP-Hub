const Datastore = require('@seald-io/nedb');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../db');

const db = {
  users: new Datastore({ filename: path.join(dbPath, 'users.db'), autoload: true }),
  posts: new Datastore({ filename: path.join(dbPath, 'posts.db'), autoload: true }),
  comments: new Datastore({ filename: path.join(dbPath, 'comments.db'), autoload: true }),
  likes: new Datastore({ filename: path.join(dbPath, 'likes.db'), autoload: true }),
  follows: new Datastore({ filename: path.join(dbPath, 'follows.db'), autoload: true }),
};

db.users.ensureIndex({ fieldName: 'username', unique: true });
db.users.ensureIndex({ fieldName: 'email', unique: true });

function bcryptHash(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) reject(err);
      else resolve(hash);
    });
  });
}

function hrs(n) {
  return n * 3600000;
}

function mkPost(user, status, content, ts) {
  return {
    userId: user._id,
    username: user.username,
    authorName: user.name,
    authorAvatar: user.avatar,
    authorAvatarColor: user.avatarColor,
    authorRole: user.role,
    content,
    status,
    likes: 0,
    dislikes: 0,
    commentCount: 0,
    createdAt: new Date(ts)
  };
}

function mkComment(user, post, content, ts) {
  return {
    postId: post._id,
    userId: user._id,
    username: user.username,
    authorName: user.name,
    authorAvatar: user.avatar,
    authorAvatarColor: user.avatarColor,
    content,
    createdAt: new Date(ts)
  };
}

function mkLike(user, post, type) {
  return {
    postId: post._id,
    userId: user._id,
    type,
    createdAt: new Date()
  };
}

function mkFollow(follower, target) {
  return {
    followerId: follower._id,
    followingId: target._id,
    createdAt: new Date()
  };
}

function dbUpdate(store, query, update) {
  return new Promise(resolve => {
    store.update(query, update, {}, resolve);
  });
}

async function seedDatabase() {
  return new Promise((resolve) => {

    db.users.count({}, async (err, count) => {

      if (err) return resolve();

      if (count > 0) {
        console.log('✅ Already seeded');
        return resolve();
      }

      console.log('🌱 Seeding database...');

      const driverHash = await bcryptHash('motogp123');
      const fanHash = await bcryptHash('fan123');
      const adminHash = await bcryptHash('admin123');

      const usersToInsert = [

        // ADMIN
        {
          username: 'admin',
          name: 'Administrator',
          email: 'admin@motogp.com',
          password: adminHash,
          role: 'admin',
          avatar: 'AD',
          avatarColor: '#7C3AED',
          bio: 'MotoGP Social Hub administrator.',
          followers: 0,
          createdAt: new Date()
        },

        // RIDERS
        { username:'marc_marquez', name:'Marc Márquez', email:'marc@motogp.com', password:driverHash, role:'driver', number:93, team:'Ducati Lenovo Team', nationality:'Spanish', bio:'8-time World Champion. Fearless and relentless.', avatar:'MM', avatarColor:'#CC0000', followers:0, createdAt:new Date() },

        { username:'francesco_bagnaia', name:'Francesco Bagnaia', email:'pecco@motogp.com', password:driverHash, role:'driver', number:63, team:'Ducati Lenovo Team', nationality:'Italian', bio:'MotoGP champion with precision and speed.', avatar:'FB', avatarColor:'#FF0000', followers:0, createdAt:new Date() },

        { username:'fabio_quartararo', name:'Fabio Quartararo', email:'fabio@motogp.com', password:driverHash, role:'driver', number:20, team:'Monster Energy Yamaha', nationality:'French', bio:'El Diablo. Former MotoGP champion.', avatar:'FQ', avatarColor:'#FFD700', followers:0, createdAt:new Date() },

        { username:'alex_rins', name:'Álex Rins', email:'rins@motogp.com', password:driverHash, role:'driver', number:42, team:'Monster Energy Yamaha', nationality:'Spanish', bio:'Technical rider with race-winning consistency.', avatar:'AR', avatarColor:'#0000FF', followers:0, createdAt:new Date() },

        { username:'pedro_acosta', name:'Pedro Acosta', email:'pedro@motogp.com', password:driverHash, role:'driver', number:37, team:'Red Bull KTM Factory Racing', nationality:'Spanish', bio:'The Shark of Murcia.', avatar:'PA', avatarColor:'#FF6600', followers:0, createdAt:new Date() },

        { username:'brad_binder', name:'Brad Binder', email:'binder@motogp.com', password:driverHash, role:'driver', number:33, team:'Red Bull KTM Factory Racing', nationality:'South African', bio:'Fearless late-braking specialist.', avatar:'BB', avatarColor:'#FF8800', followers:0, createdAt:new Date() },

        { username:'jorge_martin', name:'Jorge Martín', email:'jorge@motogp.com', password:driverHash, role:'driver', number:89, team:'Aprilia Racing', nationality:'Spanish', bio:'Sprint king and title contender.', avatar:'JM', avatarColor:'#0099FF', followers:0, createdAt:new Date() },

        { username:'marco_bezzecchi', name:'Marco Bezzecchi', email:'bez@motogp.com', password:driverHash, role:'driver', number:72, team:'Aprilia Racing', nationality:'Italian', bio:'Aggressive racer from VR46 Academy.', avatar:'MB', avatarColor:'#66CC00', followers:0, createdAt:new Date() },

        { username:'joan_mir', name:'Joan Mir', email:'mir@motogp.com', password:driverHash, role:'driver', number:36, team:'Honda HRC Castrol', nationality:'Spanish', bio:'MotoGP World Champion.', avatar:'JM', avatarColor:'#CC0000', followers:0, createdAt:new Date() },

        { username:'luca_marini', name:'Luca Marini', email:'luca@motogp.com', password:driverHash, role:'driver', number:10, team:'Honda HRC Castrol', nationality:'Italian', bio:'Technical rider and strong developer.', avatar:'LM', avatarColor:'#990000', followers:0, createdAt:new Date() },

        { username:'fabio_di_giannantonio', name:'Fabio Di Giannantonio', email:'diggia@motogp.com', password:driverHash, role:'driver', number:49, team:'VR46 Racing Team', nationality:'Italian', bio:'Italian talent with aggressive pace.', avatar:'FD', avatarColor:'#FFFF00', followers:0, createdAt:new Date() },

        { username:'franco_morbidelli', name:'Franco Morbidelli', email:'franco@motogp.com', password:driverHash, role:'driver', number:21, team:'VR46 Racing Team', nationality:'Italian', bio:'Former title challenger.', avatar:'FM', avatarColor:'#FFFF66', followers:0, createdAt:new Date() },

        { username:'alex_marquez', name:'Álex Márquez', email:'alexm@motogp.com', password:driverHash, role:'driver', number:73, team:'Gresini Racing MotoGP', nationality:'Spanish', bio:'Double world champion.', avatar:'AM', avatarColor:'#00AAFF', followers:0, createdAt:new Date() },

        { username:'fermin_aldeguer', name:'Fermín Aldeguer', email:'fermin@motogp.com', password:driverHash, role:'driver', number:54, team:'Gresini Racing MotoGP', nationality:'Spanish', bio:'Young MotoGP talent.', avatar:'FA', avatarColor:'#00CC99', followers:0, createdAt:new Date() },

        { username:'toprak_razgatlioglu', name:'Toprak Razgatlıoğlu', email:'toprak@motogp.com', password:driverHash, role:'driver', number:54, team:'Prima Pramac Yamaha', nationality:'Turkish', bio:'Superbike legend making his MotoGP move.', avatar:'TR', avatarColor:'#0033CC', followers:0, createdAt:new Date() },

        { username:'jack_miller', name:'Jack Miller', email:'jack@motogp.com', password:driverHash, role:'driver', number:43, team:'Prima Pramac Yamaha', nationality:'Australian', bio:'Aggressive overtaker.', avatar:'JM', avatarColor:'#0066FF', followers:0, createdAt:new Date() },

        { username:'raul_fernandez', name:'Raúl Fernández', email:'raul@motogp.com', password:driverHash, role:'driver', number:25, team:'Trackhouse Racing', nationality:'Spanish', bio:'Raw speed and aggression.', avatar:'RF', avatarColor:'#FF4444', followers:0, createdAt:new Date() },

        { username:'ai_ogura', name:'Ai Ogura', email:'ogura@motogp.com', password:driverHash, role:'driver', number:79, team:'Trackhouse Racing', nationality:'Japanese', bio:'Smooth Japanese talent.', avatar:'AO', avatarColor:'#FFFFFF', followers:0, createdAt:new Date() },

        { username:'maverick_vinales', name:'Maverick Viñales', email:'maverick@motogp.com', password:driverHash, role:'driver', number:12, team:'Tech3 KTM', nationality:'Spanish', bio:'Naturally gifted rider.', avatar:'MV', avatarColor:'#6633FF', followers:0, createdAt:new Date() },

        { username:'enea_bastianini', name:'Enea Bastianini', email:'enea@motogp.com', password:driverHash, role:'driver', number:23, team:'Tech3 KTM', nationality:'Italian', bio:'The Beast.', avatar:'EB', avatarColor:'#9900CC', followers:0, createdAt:new Date() },

        { username:'johann_zarco', name:'Johann Zarco', email:'zarco@motogp.com', password:driverHash, role:'driver', number:5, team:'LCR Honda', nationality:'French', bio:'Experienced veteran.', avatar:'JZ', avatarColor:'#00FF00', followers:0, createdAt:new Date() },

        { username:'diogo_moreira', name:'Diogo Moreira', email:'diogo@motogp.com', password:driverHash, role:'driver', number:11, team:'LCR Honda', nationality:'Brazilian', bio:'Brazilian rookie talent.', avatar:'DM', avatarColor:'#00AA00', followers:0, createdAt:new Date() },

        // FANS
        {
          username:'speedfreak99',
          name:'Alex Turner',
          email:'alex@fans.com',
          password:fanHash,
          role:'fan',
          avatar:'AT',
          avatarColor:'#E63946',
          bio:'Lifelong MotoGP fan.',
          followers:0,
          createdAt:new Date()
        },

        {
          username:'yamaha_girl',
          name:'Sofia Rossi',
          email:'sofia@fans.com',
          password:fanHash,
          role:'fan',
          avatar:'SR',
          avatarColor:'#2A9D8F',
          bio:'Italian MotoGP fan.',
          followers:0,
          createdAt:new Date()
        },

        {
          username:'ktm_fan_31',
          name:'Marco Diaz',
          email:'marco@fans.com',
          password:fanHash,
          role:'fan',
          avatar:'MD',
          avatarColor:'#F4A261',
          bio:'Pedro Acosta fan.',
          followers:0,
          createdAt:new Date()
        }
      ];

      db.users.insert(usersToInsert, async (err, users) => {

        if (err) return resolve();

        const find = username =>
          users.find(u => u.username === username);

        const fabio = find('fabio_quartararo');
        const pedro = find('pedro_acosta');
        const marc = find('marc_marquez');

        const alex = find('speedfreak99');
        const sofia = find('yamaha_girl');
        const marco = find('ktm_fan_31');

        const now = Date.now();

        const postsToInsert = [
          mkPost(fabio, 'approved', '🏁 Perfect qualifying lap today. Yamaha feels amazing.', now - hrs(1)),
          mkPost(pedro, 'approved', '🦈 Learning every session. KTM is improving fast.', now - hrs(3)),
          mkPost(marc, 'approved', '💪 Every race is a new battle. Never give up.', now - hrs(5)),

          mkPost(alex, 'pending', 'Fabio can still fight for titles with the right bike.', now - hrs(0.5)),
        ];

        db.posts.insert(postsToInsert, async (err, posts) => {

          if (err) return resolve();

          const approved = posts.filter(p => p.status === 'approved');

          const comments = [
            mkComment(alex, approved[0], 'Insane lap 🔥', now - hrs(0.5)),
            mkComment(sofia, approved[0], 'El Diablo is back 💛', now - hrs(0.4)),
            mkComment(marco, approved[1], 'Pedro is unreal 🦈', now - hrs(2)),
          ];

          db.comments.insert(comments, async (_, insertedComments) => {

            for (const c of insertedComments) {
              await dbUpdate(
                db.posts,
                { _id: c.postId },
                { $inc: { commentCount: 1 } }
              );
            }

            const likes = [
              mkLike(alex, approved[0], 'like'),
              mkLike(sofia, approved[0], 'like'),
              mkLike(marco, approved[1], 'like'),
            ];

            db.likes.insert(likes, async (_, insertedLikes) => {

              for (const like of insertedLikes) {
                await dbUpdate(
                  db.posts,
                  { _id: like.postId },
                  { $inc: { likes: 1 } }
                );
              }

              const follows = [
                mkFollow(alex, fabio),
                mkFollow(sofia, fabio),
                mkFollow(marco, pedro),
                mkFollow(alex, marc)
              ];

              db.follows.insert(follows, async () => {

                await dbUpdate(
                  db.users,
                  { _id: fabio._id },
                  { $set: { followers: 2 } }
                );

                await dbUpdate(
                  db.users,
                  { _id: pedro._id },
                  { $set: { followers: 1 } }
                );

                await dbUpdate(
                  db.users,
                  { _id: marc._id },
                  { $set: { followers: 1 } }
                );

                console.log('🏁 Database seeded successfully!');
                resolve();

              });
            });
          });
        });
      });
    });
  });
}

seedDatabase();

module.exports = db;
