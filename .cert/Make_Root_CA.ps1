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
$passwordCA = ConvertTo-SecureString -String "CHOOSE_PASSWORD" -Force -AsPlainText
Export-PfxCertificate `
    -Cert $rootCA `
    -FilePath ".\NCORP_ROOT_CA.pfx" `
    -Password $passwordCA

