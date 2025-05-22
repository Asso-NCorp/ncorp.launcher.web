# Crée l'autorité de certification auto-signée
$rootCA = New-SelfSignedCertificate `
    -Subject "CN=NCORP ROOT CA V1, O=NCORP, C=FR" `
    -KeyExportPolicy Exportable `
    -KeyLength 4096 `
    -KeyAlgorithm RSA `
    -HashAlgorithm SHA256 `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -KeyUsageProperty Sign `
    -KeyUsage CertSign, CRLSign, DigitalSignature `
    -NotAfter (Get-Date).AddYears(10) `
    -Type Custom

# Exporte l'autorité racine au format PFX (optionnel mais conseillé)
$passwordCA = ConvertTo-SecureString -String "F0ll0wM3%%%%%%%%!" -Force -AsPlainText
Export-PfxCertificate `
    -Cert $rootCA `
    -FilePath ".\NCORP_ROOT_CA.pfx" `
    -Password $passwordCA

# Génère le certificat SSL wildcard signé par cette autorité
$wildcardCert = New-SelfSignedCertificate `
    -Subject "CN=*.n-lan.com, O=NCORP, C=FR" `
    -DnsName "*.n-lan.com" `
    -Signer $rootCA `
    -KeyExportPolicy Exportable `
    -KeyLength 2048 `
    -KeyAlgorithm RSA `
    -HashAlgorithm SHA256 `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(2) `
    -Type Custom `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

# Optionnel : exporter l'autorité racine au format CER pour l'installation sur les clients
Export-Certificate `
    -Cert $rootCA `
    -FilePath ".\NCORP_ROOT_CA.cer"

# Exporte le certificat wildcard en PEM (public)
Export-Certificate `
    -Cert $wildcardCert `
    -FilePath ".\wildcard_n-lan_com.pem"

# Pour exporter sans mot de passe, utilise une méthode alternative avec .NET :
$pfxBytes = $wildcardCert.Export("PFX")

[System.IO.File]::WriteAllBytes(".\wildcard_n-lan_com.pfx", $pfxBytes)

# Conversion du PFX vers PEM et KEY sans mot de passe (OpenSSL)
openssl pkcs12 -in ".\wildcard_n-lan_com.pfx" -nocerts -nodes -out ".\wildcard_n-lan_com.key" -passin pass:
openssl pkcs12 -in ".\wildcard_n-lan_com.pfx" -clcerts -nokeys -out ".\wildcard_n-lan_com.pem" -passin pass:

