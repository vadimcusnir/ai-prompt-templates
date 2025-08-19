# 🔧 Configurarea Google OAuth în Supabase

## 📋 Credențialele Google OAuth

**Client ID:** `42335911515-h37994if82hi335ardgt62b884iscj2r.apps.googleusercontent.com`
**Client Secret:** `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`

## 🎯 Pașii de Configurare în Supabase Dashboard

### 1. Accesează Supabase Dashboard
- Mergi la [supabase.com](https://supabase.com)
- Accesează proiectul: `tthyfqqdkifnerlsefmn`

### 2. Navighează la Authentication > Providers
- În meniul din stânga, click pe **Authentication**
- Click pe **Providers**

### 3. Activează Google Provider
- Găsește **Google** în lista de provideri
- Click pe **Enable** sau toggle button

### 4. Configurează Credențialele
```
Provider: Google
Client ID: 42335911515-h37994if82hi335ardgt62b884iscj2r.apps.googleusercontent.com
Client Secret: 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
```

### 5. Configurează Redirect URL
```
Redirect URL: https://tthyfqqdkifnerlsefmn.supabase.co/auth/v1/callback
```

### 6. Salvează Configurația
- Click pe **Save** sau **Update**

## 🌐 Configurarea în Google Cloud Console

### 1. Accesează Google Cloud Console
- Mergi la [console.cloud.google.com](https://console.cloud.google.com)
- Selectează proiectul tău

### 2. Navighează la APIs & Services > Credentials
- Click pe **APIs & Services**
- Click pe **Credentials**

### 3. Editează OAuth 2.0 Client ID
- Găsește clientul OAuth 2.0
- Click pe **Edit** (iconița creion)

### 4. Configurează Authorized JavaScript Origins
```
https://tthyfqqdkifnerlsefmn.supabase.co
https://ai-prompt-templates.com
https://www.ai-prompt-templates.com
http://localhost:3000
http://localhost:3001
http://localhost:3002
```

### 5. Configurează Authorized Redirect URIs
```
https://tthyfqqdkifnerlsefmn.supabase.co/auth/v1/callback
https://ai-prompt-templates.com/auth/callback
https://www.ai-prompt-templates.com/auth/callback
```

### 6. Salvează Modificările
- Click pe **Save**

## ✅ Verificare Configurare

### 1. Testează în Supabase Dashboard
- Mergi la **Authentication > Users**
- Click pe **Add User**
- Încearcă să creezi un user cu Google

### 2. Testează pe Site
- Mergi la `/auth`
- Click pe **Sign in with Google**
- Verifică că redirect-ul funcționează

### 3. Verifică Logurile
- În Supabase Dashboard > Logs
- Caută erori legate de Google OAuth

## 🚨 Troubleshooting

### Problema: "Invalid redirect_uri"
**Soluție:** Verifică că redirect URI-ul din Google Cloud Console este exact cel din Supabase

### Problema: "Client ID not found"
**Soluție:** Verifică că Client ID-ul din Supabase este corect

### Problema: "Client Secret invalid"
**Soluție:** Verifică că Client Secret-ul din Supabase este corect

## 🔐 Securitate

- ✅ **Nu partaja** Client Secret-ul public
- ✅ **Folosește HTTPS** în producție
- ✅ **Monitorizează** logurile de autentificare
- ✅ **Configurează** rate limiting dacă este necesar

## 📞 Suport

Pentru probleme:
1. Verifică logurile Supabase
2. Verifică configurația Google Cloud Console
3. Testează cu un user nou
4. Verifică că toate URL-urile sunt corecte
