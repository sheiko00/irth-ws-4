param(
    [string[]]$Files = @("assets/irth-main.css", "assets/irth-main.js")
)

$store = "irth-13.myshopify.com"
$theme = "154488471690"

foreach ($f in $Files) {
    Write-Host "Pushing: $f" -ForegroundColor Cyan
}

$onlyArgs = $Files | ForEach-Object { "--only", $_ }

shopify theme push --store $store --theme $theme --allow-live @onlyArgs
