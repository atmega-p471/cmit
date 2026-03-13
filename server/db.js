const Datastore = require('nedb-promises');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const users   = Datastore.create({ filename: path.join(dataDir, 'users.db'),   autoload: true });
const news    = Datastore.create({ filename: path.join(dataDir, 'news.db'),    autoload: true });
const courses = Datastore.create({ filename: path.join(dataDir, 'courses.db'), autoload: true });
const media   = Datastore.create({ filename: path.join(dataDir, 'media.db'),   autoload: true });

const COURSES_SEED = [
  { title: 'Программирование на языке Си',                          description: 'Наставник: Санин Владислав. Авторский курс для школьников и студентов.',       duration: '2 часа', schedule: 'Понедельник 17:00' },
  { title: 'Английский язык',                                       description: 'Наставник: Надежда Воронова. Авторский курс для школьников и студентов.',        duration: '2 часа', schedule: 'Понедельник 18:00' },
  { title: 'Аддитивные технологии',                                 description: 'Наставник: Дорофеев Егор. Авторский курс для школьников и студентов.',           duration: '2 часа', schedule: 'Вторник 17:00'    },
  { title: 'Основы механической обработки, работа на станках с ЧПУ',description: 'Наставник: Артем Артемьев. Авторский курс для школьников и студентов.',        duration: '2 часа', schedule: 'Вторник 17:00'    },
  { title: 'Беспилотные летательные аппараты',                      description: 'Наставники: Федоров Виталий и Александр Олейников. Авторский курс для школьников.', duration: '2 часа', schedule: 'Среда 17:00'      },
  { title: 'Основы программирования на Python',                      description: 'Наставник: Павлычев Артем. Авторский курс для школьников и студентов.',          duration: '2 часа', schedule: 'Среда 17:00'      },
  { title: 'Лазерные технологии и основы векторной графики',         description: 'Наставник: Даниил Барабанов. Авторский курс для школьников и студентов.',        duration: '2 часа', schedule: 'Среда 17:00'      },
  { title: 'Английский язык (второй поток)',                         description: 'Наставник: Надежда Воронова. Авторский курс для школьников и студентов.',        duration: '2 часа', schedule: 'Среда 18:00'      },
  { title: 'Робототехника',                                          description: 'Наставник: Артемьев Александр. Авторский курс для школьников и студентов.',      duration: '2 часа', schedule: 'Четверг 17:00'    },
  { title: 'Основы электроники',                                     description: 'Наставник: Федоров Виталий. Авторский курс для школьников и студентов.',         duration: '2 часа', schedule: 'Четверг 17:00'    },
  { title: 'Программирование Arduino',                               description: 'Наставник: Владислав Старко. Авторский курс для школьников и студентов.',        duration: '2 часа', schedule: 'Пятница 17:00'    },
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

(async () => {
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'cmit2026';

  const existing = await users.findOne({ username: adminUser });
  if (!existing) {
    await users.insert({
      username: adminUser,
      password: bcrypt.hashSync(adminPass, 10)
    });
  }

  const courseCount = await courses.count({});
  if (courseCount === 0) {
    for (const c of COURSES_SEED) {
      await courses.insert({ _id: uid(), ...c, image: '', createdAt: new Date().toISOString() });
    }
  }
})();

module.exports = { users, news, courses, media };
