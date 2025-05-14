// Bu dosya, tarayıcı ilerleme çubuğunu tamamlamak için kullanılan 
// mini bir HTML sayfasıdır. Ana sayfanızın aynı dizine koyun.

document.write(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Loader</title>
        <script>
        // İçinde bulunduğumuz pencereyi ana sayfaya bildir
        window.onload = function() {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage('complete', '*');
            }
        };
        </script>
    </head>
    <body>
        <!-- Boş sayfa, sadece yükleme olaylarını tetiklemek için -->
    </body>
    </html>
    `);