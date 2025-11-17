# Configuration
$caPfx = "NCORP_ROOT_CA.pfx"
$caPassword = "CHOOSE_PASSWORD"
$domain = Read-Host "Domaine du certificat (ex: agent.n-lan.com)"

# Extrait certificat et clé privée depuis ta Root CA .pfx
openssl pkcs12 -in $caPfx -nocerts -nodes -out ca.key -passin pass:$caPassword
openssl pkcs12 -in $caPfx -clcerts -nokeys -out ca.crt -passin pass:$caPassword

# Crée un fichier de configuration pour le serveur web
$serverCnf = ".\server.cnf"
Set-Content -Path $serverCnf -Value @"
[req]
default_bits = 4096
default_md = sha256
prompt = no
distinguished_name = dn

[dn]
CN = ${domain}

[ext]
basicConstraints = CA:FALSE
subjectAltName = DNS:${domain}
extendedKeyUsage = serverAuth
keyUsage = digitalSignature, keyEncipherment
"@ -Encoding ASCII

# Génère clé privée et CSR pour le domaine
openssl req -new -newkey rsa:4096 -nodes `
    -keyout "${domain}.key" `
    -out "${domain}.csr" `
    -config $serverCnf -reqexts ext

# Signe le certificat avec ta CA extraite
openssl x509 -req `
    -in "${domain}.csr" `
    -CA ca.crt `
    -CAkey ca.key `
    -CAcreateserial `
    -days 3650 `
    -extfile $serverCnf -extensions ext `
    -out "${domain}.crt"

# Convertit en PEM et PFX sans mot de passe
openssl x509 -in "${domain}.crt" -out "${domain}.pem" -outform PEM
openssl pkcs12 -inkey "${domain}.key" -in "${domain}.crt" -export -out "${domain}.pfx" -passout pass:

# Nettoie les fichiers temporaires
Remove-Item $serverCnf
Remove-Item ca.key
Remove-Item ca.crt
Remove-Item "${domain}.csr"
