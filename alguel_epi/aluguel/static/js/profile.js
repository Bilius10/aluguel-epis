document.addEventListener('DOMContentLoaded', function() {

    const userNameDisplay = document.getElementById('user-name-display');
    const userIconDisplay = document.getElementById('user-icon-display');

    function loadProfileHeader() {
        if (!userNameDisplay) return; 

        const savedName = localStorage.getItem('userName') || 'Usuario';
        const savedImage = localStorage.getItem('userImage');

        userNameDisplay.textContent = savedName;
        if (savedImage) {
            let headerPic = document.querySelector('.header-profile-pic');
            if (!headerPic) {
                headerPic = document.createElement('img');
                headerPic.classList.add('header-profile-pic');

                if (document.getElementById('user-icon-display')) {
                    userIconDisplay.replaceWith(headerPic);
                }
            }
            headerPic.src = savedImage;
        }
    }
    
    loadProfileHeader();

    const profileForm = document.getElementById('profile-editor-form');

    if (profileForm) {
        const profilePreview = document.getElementById('profile-preview');
        const profileUpload = document.getElementById('profile-upload');
        const profileNameInput = document.getElementById('profile-name-input');
        const saveProfileBtn = document.getElementById('save-profile-btn');

        profileNameInput.value = localStorage.getItem('userName') || 'João Silva';
        if (localStorage.getItem('userImage')) {
            profilePreview.src = localStorage.getItem('userImage');
        }

        profileUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profilePreview.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });

        saveProfileBtn.addEventListener('click', function() {
            const newName = profileNameInput.value;
            const newImage = profilePreview.src;

            localStorage.setItem('userName', newName);
            localStorage.setItem('userImage', newImage);

            alert('Perfil atualizado com sucesso!');
            
            loadProfileHeader(); 
        });
    }
});