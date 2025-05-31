const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const USERS_FILE = path.join(__dirname, 'users.json');

// الترجمات
const translations = {
  ar: {
    fileReadError: 'خطأ في قراءة الملف',
    fileSaveError: 'خطأ في حفظ الملف',
    usernameCheckError: 'حدث خطأ في التحقق من اسم المستخدم',
    allFieldsRequired: 'جميع الحقول مطلوبة',
    usernameMinLength: 'اسم المستخدم يجب أن يكون 4 أحرف على الأقل',
    usernameTaken: 'اسم المستخدم مستخدم بالفعل',
    emailTaken: 'البريد الإلكتروني مستخدم بالفعل',
    accountCreated: 'تم إنشاء الحساب بنجاح',
    dataSaveError: 'حدث خطأ في حفظ البيانات',
    accountCreateError: 'حدث خطأ في إنشاء الحساب',
    credentialsRequired: 'البريد الإلكتروني وكلمة المرور مطلوبان',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    loginSuccess: 'تم تسجيل الدخول بنجاح',
    loginError: 'حدث خطأ في تسجيل الدخول',
    serverRunning: '✅ الخادم يعمل على المنفذ'
  },
  en: {
    fileReadError: 'Error reading file',
    fileSaveError: 'Error saving file',
    usernameCheckError: 'Error checking username',
    allFieldsRequired: 'All fields are required',
    usernameMinLength: 'Username must be at least 4 characters',
    usernameTaken: 'Username is already taken',
    emailTaken: 'Email is already taken',
    accountCreated: 'Account created successfully',
    dataSaveError: 'Error saving data',
    accountCreateError: 'Error creating account',
    credentialsRequired: 'Email and password are required',
    invalidCredentials: 'Invalid email or password',
    loginSuccess: 'Logged in successfully',
    loginError: 'Error logging in',
    serverRunning: '✅ Server running on port'
  }
};

// قراءة بيانات المستخدمين
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, '{}');
      return {};
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(translations.ar.fileReadError, err);
    return {};
  }
}

// حفظ بيانات المستخدمين
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (err) {
    console.error(translations.ar.fileSaveError, err);
    return false;
  }
}

// التحقق من توافر اسم المستخدم
app.get('/api/check-username/:username', (req, res) => {
  try {
    const users = readUsers();
    const username = req.params.username.toLowerCase();
    const exists = Object.values(users).some(u => u.username.toLowerCase() === username);
    res.json({ available: !exists });
  } catch (err) {
    console.error(translations.ar.usernameCheckError, err);
    res.status(500).json({ 
      message: {
        ar: translations.ar.usernameCheckError,
        en: translations.en.usernameCheckError
      }
    });
  }
});

// إنشاء حساب جديد
app.post('/api/register', (req, res) => {
  try {
    const { fullname, username, email, phone, password } = req.body;

    // التحقق من البيانات المطلوبة
    if (!fullname || !username || !email || !phone || !password) {
      return res.status(400).json({ 
        message: {
          ar: translations.ar.allFieldsRequired,
          en: translations.en.allFieldsRequired
        }
      });
    }

    // التحقق من طول اسم المستخدم
    if (username.length < 4) {
      return res.status(400).json({ 
        message: {
          ar: translations.ar.usernameMinLength,
          en: translations.en.usernameMinLength
        }
      });
    }

    const users = readUsers();

    // التحقق من عدم تكرار اسم المستخدم
    if (Object.values(users).some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ 
        message: {
          ar: translations.ar.usernameTaken,
          en: translations.en.usernameTaken
        }
      });
    }

    // التحقق من عدم تكرار البريد الإلكتروني
    if (Object.values(users).some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ 
        message: {
          ar: translations.ar.emailTaken,
          en: translations.en.emailTaken
        }
      });
    }

    // إنشاء معرف فريد للمستخدم
    const userId = `user${Date.now()}`;

    // إضافة المستخدم الجديد
    users[userId] = {
      fullname,
      username,
      email,
      phone,
      password,
      createdAt: new Date().toISOString()
    };

    // حفظ البيانات
    if (saveUsers(users)) {
      res.json({ 
        message: {
          ar: translations.ar.accountCreated,
          en: translations.en.accountCreated
        }
      });
    } else {
      res.status(500).json({ 
        message: {
          ar: translations.ar.dataSaveError,
          en: translations.en.dataSaveError
        }
      });
    }
  } catch (err) {
    console.error(translations.ar.accountCreateError, err);
    res.status(500).json({ 
      message: {
        ar: translations.ar.accountCreateError,
        en: translations.en.accountCreateError
      }
    });
  }
});

// تسجيل الدخول
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: {
          ar: translations.ar.credentialsRequired,
          en: translations.en.credentialsRequired
        }
      });
    }

    const users = readUsers();
    const user = Object.values(users).find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return res.status(400).json({ 
        message: {
          ar: translations.ar.invalidCredentials,
          en: translations.en.invalidCredentials
        }
      });
    }

    res.json({
      message: {
        ar: translations.ar.loginSuccess,
        en: translations.en.loginSuccess
      },
      user: {
        fullname: user.fullname,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error(translations.ar.loginError, err);
    res.status(500).json({ 
      message: {
        ar: translations.ar.loginError,
        en: translations.en.loginError
      }
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`${translations.ar.serverRunning} ${PORT}`);
  console.log(`${translations.en.serverRunning} ${PORT}`);
});
