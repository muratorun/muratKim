// Form gönderim işlemini yönetecek script
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const form = this;
    const statusDiv = document.getElementById('form-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Gönderme butonunu devre dışı bırak ve yükleniyor mesajı göster
    submitBtn.disabled = true;
    statusDiv.style.display = 'block';
    statusDiv.textContent = 'Mesajınız gönderiliyor...';
    statusDiv.style.color = '#2563eb';
    
    // Form verilerini topla
    const formData = new FormData(form);
    
    // Formspree API'a gönder
    fetch(form.action, {
        method: form.method,
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Form gönderilemedi. Lütfen daha sonra tekrar deneyiniz.');
    })
    .then(data => {
        // Başarılı gönderim
        statusDiv.textContent = 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapılacaktır.';
        statusDiv.style.color = 'green';
        form.reset();
    })
    .catch(error => {
        // Hata durumu
        statusDiv.textContent = error.message;
        statusDiv.style.color = 'red';
    })
    .finally(() => {
        // Gönder butonunu tekrar aktif et
        submitBtn.disabled = false;
    });
});
