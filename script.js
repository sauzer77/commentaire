document.addEventListener('DOMContentLoaded', () => {
    // --- Références aux éléments du DOM ---
    const commentForm = document.getElementById('comment-form');
    const authorNameInput = document.getElementById('author-name');
    const commentTextInput = document.getElementById('comment-text');
    const commentsListDiv = document.getElementById('comments-list');
    const noCommentsMessage = document.querySelector('.no-comments-message');
    const postCommentBtn = document.getElementById('post-comment-btn');

    const LOCAL_STORAGE_KEY = 'interactiveBlogComments'; // Clé unique pour localStorage

    // --- Fonctions de Gestion du Stockage (LocalStorage) ---

    /**
     * Charge les commentaires depuis localStorage.
     * @returns {Array<Object>} Un tableau d'objets commentaire.
     */
    function loadComments() {
        const commentsJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        try {
            const comments = commentsJSON ? JSON.parse(commentsJSON) : [];
            // Assurer que chaque commentaire a un ID unique pour l'édition/suppression
            return Array.isArray(comments) ? comments.map(comment => ({
                id: comment.id || Date.now() + Math.random().toString(36).substring(2, 9), // Génère un ID si manquant
                ...comment
            })) : [];
        } catch (e) {
            console.error("Erreur de parsing JSON depuis localStorage:", e);
            return [];
        }
    }

    /**
     * Sauvegarde un tableau de commentaires dans localStorage.
     * @param {Array<Object>} comments - Le tableau d'objets commentaire à sauvegarder.
     */
    function saveComments(comments) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(comments));
    }

    // --- Fonctions de Manipulation du DOM et d'Affichage ---

    /**
     * Crée et retourne un élément HTML pour un commentaire donné.
     * Inclut les boutons d'édition et de suppression.
     * @param {Object} comment - L'objet commentaire { id, author, text, date }.
     * @returns {HTMLElement} L'élément div représentant le commentaire.
     */
    function createCommentElement(comment) {
        const commentItem = document.createElement('div');
        commentItem.classList.add('comment-item');
        commentItem.dataset.id = comment.id; // Stocke l'ID du commentaire sur l'élément HTML

        const commentHeader = document.createElement('div');
        commentHeader.classList.add('comment-header');

        const authorSpan = document.createElement('span');
        authorSpan.classList.add('comment-author');
        authorSpan.textContent = comment.author;

        const dateSpan = document.createElement('span');
        dateSpan.classList.add('comment-date');
        const commentDate = new Date(comment.date);
        dateSpan.textContent = commentDate.toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const textParagraph = document.createElement('p');
        textParagraph.classList.add('comment-text');
        textParagraph.textContent = comment.text;

        // Zone de texte pour l'édition (initialement cachée)
        const editTextArea = document.createElement('textarea');
        editTextArea.classList.add('edit-textarea');
        editTextArea.value = comment.text;
        editTextArea.rows = 4;

        // Boutons d'action (Éditer, Supprimer, Enregistrer, Annuler)
        const commentActions = document.createElement('div');
        commentActions.classList.add('comment-actions');

        const editBtn = document.createElement('button');
        editBtn.classList.add('edit-btn');
        editBtn.textContent = 'Modifier';
        editBtn.addEventListener('click', () => enableEditMode(commentItem, comment));

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.textContent = 'Supprimer';
        deleteBtn.addEventListener('click', () => deleteComment(comment.id));

        const saveEditBtn = document.createElement('button');
        saveEditBtn.classList.add('save-edit-btn');
        saveEditBtn.textContent = 'Enregistrer';
        saveEditBtn.addEventListener('click', () => saveEditedComment(comment.id, editTextArea.value));

        const cancelEditBtn = document.createElement('button');
        cancelEditBtn.classList.add('cancel-edit-btn');
        cancelEditBtn.textContent = 'Annuler';
        cancelEditBtn.addEventListener('click', () => disableEditMode(commentItem, comment));

        // Assemblage
        commentHeader.appendChild(authorSpan);
        commentHeader.appendChild(dateSpan);
        commentActions.appendChild(editBtn);
        commentActions.appendChild(deleteBtn);
        commentItem.appendChild(commentHeader);
        commentItem.appendChild(commentActions); // Ajout des actions
        commentItem.appendChild(textParagraph);
        commentItem.appendChild(editTextArea);
        commentItem.appendChild(saveEditBtn);
        commentItem.appendChild(cancelEditBtn);

        return commentItem;
    }

    /**
     * Affiche tous les commentaires dans le DOM, triés du plus récent au plus ancien.
     */
    function displayComments() {
        const comments = loadComments();
        commentsListDiv.innerHTML = ''; // Vider la liste actuelle

        if (comments.length === 0) {
            commentsListDiv.appendChild(noCommentsMessage);
            noCommentsMessage.style.display = 'block';
        } else {
            noCommentsMessage.style.display = 'none';
            // Trier les commentaires par date (du plus récent au plus ancien)
            comments.sort((a, b) => new Date(b.date) - new Date(a.date));

            comments.forEach(comment => {
                const commentElement = createCommentElement(comment);
                commentsListDiv.appendChild(commentElement);
            });
        }
    }

    // --- Fonctions d'Action sur les Commentaires ---

    /**
     * Active le mode édition pour un commentaire spécifique.
     * @param {HTMLElement} commentItem - L'élément HTML du commentaire.
     * @param {Object} commentData - L'objet commentaire associé.
     */
    function enableEditMode(commentItem, commentData) {
        commentItem.classList.add('editing');
        // Pré-remplir le textarea avec le texte actuel
        commentItem.querySelector('.edit-textarea').value = commentData.text;
        commentItem.querySelector('.edit-textarea').focus();
    }

    /**
     * Désactive le mode édition pour un commentaire spécifique.
     * @param {HTMLElement} commentItem - L'élément HTML du commentaire.
     * @param {Object} commentData - L'objet commentaire associé.
     */
    function disableEditMode(commentItem, commentData) {
        commentItem.classList.remove('editing');
        // Rétablir le texte original au cas où l'édition a été annulée
        commentItem.querySelector('.comment-text').textContent = commentData.text;
    }

    /**
     * Enregistre le commentaire édité dans localStorage et met à jour l'affichage.
     * @param {string} commentId - L'ID du commentaire à modifier.
     * @param {string} newText - Le nouveau texte du commentaire.
     */
    function saveEditedComment(commentId, newText) {
        const comments = loadComments();
        const commentIndex = comments.findIndex(c => c.id === commentId);

        if (commentIndex !== -1) {
            comments[commentIndex].text = newText.trim(); // Met à jour le texte
            comments[commentIndex].date = new Date().toISOString(); // Met à jour la date de modification
            saveComments(comments); // Sauvegarde les changements
            displayComments(); // Réaffiche tous les commentaires
        }
    }

    /**
     * Supprime un commentaire du localStorage et met à jour l'affichage.
     * @param {string} commentId - L'ID du commentaire à supprimer.
     */
    function deleteComment(commentId) {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
            let comments = loadComments();
            // Filtrer le tableau pour exclure le commentaire avec l'ID donné
            comments = comments.filter(comment => comment.id !== commentId);
            saveComments(comments);
            displayComments(); // Réaffiche les commentaires restants
        }
    }

    // --- Gestion des Événements ---

    // Gérer la soumission du formulaire pour ajouter/éditer
    commentForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const author = authorNameInput.value.trim();
        const text = commentTextInput.value.trim();

        if (!author || !text) {
            alert('Veuillez remplir tous les champs.');
            return;
        }

        // Créer un nouvel objet commentaire avec un ID unique
        const newComment = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // ID unique
            author: author,
            text: text,
            date: new Date().toISOString()
        };

        const comments = loadComments();
        comments.push(newComment);
        saveComments(comments);

        displayComments(); // Mettre à jour l'affichage

        // Réinitialiser le formulaire
        commentForm.reset();
    });

    // --- Initialisation ---
    displayComments(); // Affiche les commentaires au chargement de la page
});