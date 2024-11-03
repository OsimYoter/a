
    document.addEventListener('DOMContentLoaded', function() {
        const welcomeScreen = document.querySelector('.welcome-screen');
        const formScreen = document.querySelector('.form-screen');
        const chatScreen = document.querySelector('.chat-screen');
        const startChatBtn = document.getElementById('start-chat-btn');
        const startBtn = document.getElementById('start-btn');
        const userDetailsForm = document.getElementById('user-details-form');
        const formSteps = document.querySelectorAll('.form-step');
        const nextButtons = document.querySelectorAll('.next-step');
        const prevButtons = document.querySelectorAll('.prev-step');
        const previewBtn = document.getElementById('preview-btn');
        const previewModal = document.getElementById('preview-modal');
        const closeModal = document.getElementById('close-modal');
        const backToFormBtn = document.getElementById('back-to-form-btn');
        let currentFormStep = 0; // Keep track of the current form step
        const totalFormSteps = formSteps.length; // Get the total number of form steps
        let sessionId = null;
        let sessionStarted = false; // Track if the session has started
        const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']; // Hebrew month names
        const serviceStartDate = document.getElementById('serviceStartDate');
        const serviceEndDate = document.getElementById('serviceEndDate');
        const unknownServicePeriod = document.getElementById('unknownServicePeriod');
        const noEndDate = document.getElementById('noEndDate');
        const dateWarning = document.getElementById('dateWarning');
        let startDate, endDate;
        // Get references to the verification screen and thank you screen
        const verificationScreen = document.getElementById('verification-screen');
        const thankYouScreen = document.getElementById('thank-you-screen');
        const adSubmitBtn = document.getElementById('ad-submit-btn');
        const finalSubmitBtn = document.getElementById('final-submit-btn'); // Add final-submit button reference
        let mediaRecorder;
        let audioBlob;
        const recordBtn = document.getElementById('record-btn');
        const stopBtn = document.getElementById('stop-btn');
        const audioPlayback = document.getElementById('audio-playback');
        const pdfFileInput = document.getElementById('pdfFile');
        const recordingTimer = document.getElementById('recording-timer');

          
        // Initialize tooltips
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        
        // Sample initial ad data
        let adData = {
            uType: '',
            region: '',
            position: '',
            skills: ['', ''],
            unitDetails: ['', ''],
            serviceConditions: ['', ''],
            //servicePeriodRange: {start: '', end: ''},
            recruitmentIn: '',
            serviceLength: '',
            shalishutStatus: '',
            contact: '',
            adNumber: ''
        };

        // Add the color-flash effect every 30 seconds for 5 seconds
        setInterval(() => {
            previewBtn.classList.add('color-flash');
            setTimeout(() => previewBtn.classList.remove('color-flash'), 5000); // Flash for 5 seconds
        }, 30000); // Trigger every 30 seconds


        // Initialize Bootstrap Datepicker
        $('.datepicker').datepicker({
            format: 'dd/mm/yyyy',
            autoclose: true,
            todayHighlight: true
        });

        // Handle "אין תקופת שירות ידועה" checkbox
        unknownServicePeriod.addEventListener('change', function() {
            if (this.checked) {
                serviceStartDate.disabled = true;
                serviceEndDate.disabled = true;
                noEndDate.disabled = true;
            } else {
                serviceStartDate.disabled = false;
                serviceEndDate.disabled = false;
                noEndDate.disabled = false;
            }
        });

        // Handle "ללא צפי סיום" checkbox
        noEndDate.addEventListener('change', function() {
            if (this.checked) {
                serviceEndDate.disabled = true;
            } else {
                serviceEndDate.disabled = false;
            }
        });

        // Validate the start and end date
        function validateDates() {
            if (startDate && endDate) {
                if (new Date(startDate) > new Date(endDate)) {
                    dateWarning.style.display = 'block';
                    return false;
                } else {
                    dateWarning.style.display = 'none';
                    return true;
                }
            }
            return true;  
        }

        // Listen for date selection
        $(serviceStartDate).on('changeDate', function(e) {
            startDate = e.date;
            validateDates();
            determineRecruitmentPeriod(); // Update the recruitment period when start date changes

        });

        $(serviceEndDate).on('changeDate', function(e) {
            endDate = e.date;
            validateDates();
        });
            
        
        // Handle form submission
        document.getElementById('user-details-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Prevent moving to the next screen if dates are invalid
            if (!validateDates()) {
                return;
            }
    
            // Save dates for preview
            let formattedStartDate = 'לא ידוע';
            let formattedEndDate = 'לא ידוע';
            
            if (!unknownServicePeriod.checked) {
                // Extract and format start date month
                if (startDate) {
                    formattedStartDate = months[startDate.getMonth()];
                }
    
                // Extract and format end date month or handle "no end date" case
                if (noEndDate.checked) {
                    formattedEndDate = 'ללא צפי סיום';
                } else if (endDate) {
                    formattedEndDate = months[endDate.getMonth()];
                }
            }
            // Logic to prevent showing "לא ידוע - לא ידוע"
            if (formattedStartDate === 'לא ידוע' && formattedEndDate === 'לא ידוע') {
                adData.servicePeriodRange = 'לא ידוע'; // Show only once
            } else {
                adData.servicePeriodRange = `${formattedStartDate} - ${formattedEndDate}`; // Show full range
            }
            // Proceed to the chat screen
            switchToScreen(chatScreen);
        });
            
        function determineRecruitmentPeriod() {
            // If the service period is unknown, set the default message
            if (unknownServicePeriod.checked) {
                adData.recruitmentIn = '🗓️ הצבה מיידית, גיוס בהמשך';
                return;
            }
        
            // Check if the start date is defined
            if (startDate) {
                const currentDate = new Date();
                const diffInDays = Math.ceil((startDate - currentDate) / (1000 * 60 * 60 * 24)); // Calculate the difference in days
        
                if (diffInDays <= 5) {
                    adData.recruitmentIn = '⏰ גיוס מיידי';
                } else if (diffInDays <= 13) {
                    adData.recruitmentIn = '📅 גיוס בעוד מספר ימים';
                } else if (diffInDays <= 50) {
                    adData.recruitmentIn = '🗓️ גיוס בעוד מספר שבועות';
                } else {
                    adData.recruitmentIn = '🗓️ גיוס בעוד מספר חודשים';
                }
            } else {
                adData.recruitmentIn = '🗓️ הצבה מיידית, גיוס בהמשך'; // Fallback if no date is selected
            }
        }
            

        if (startBtn) {
            // Start button functionality
            startBtn.addEventListener('click', function() {
                const welcomeScreen = document.querySelector('.welcome-screen');
                const formScreen = document.querySelector('.form-screen');
                welcomeScreen.classList.remove('active');
                formScreen.classList.add('active');
            });
        } else {
            console.error('startBtn element not found');
        }

            
        // Form navigation with validation
        nextButtons.forEach(button => {
            button.addEventListener('click', () => {
                const currentStep = button.closest('.form-step');
                const inputs = currentStep.querySelectorAll('input, select');
                let allValid = true;

                inputs.forEach(input => {
                    if (!input.checkValidity()) {
                        allValid = false;
                        input.classList.add('is-invalid');
                
                        // Add custom error messages
                        const errorMessage = input.nextElementSibling;
                        if (errorMessage && errorMessage.classList.contains('invalid-feedback')) {
                            // Use custom messages based on input ID
                            switch (input.id) {
                                case 'firstName':
                                    errorMessage.textContent = "אנא הזן שם פרטי.";
                                    break;
                                case 'lastName':
                                    errorMessage.textContent = "אנא הזן שם משפחה.";
                                    break;
                                case 'phoneNumber':
                                    errorMessage.textContent = "מספר הטלפון חייב להכיל 10 ספרות ולהתחיל ב-05";
                                    break;
                                // ... add more cases for other input fields ...
                                default:
                                    errorMessage.textContent = "אנא מלא שדה זה."; // Default message
                            } 
                        } else { // *** This else block was missing an opening brace! ***
                            const newErrorMessage = document.createElement('div');
                            newErrorMessage.className = 'invalid-feedback';
                            newErrorMessage.textContent = "אנא מלא שדה זה."; // Use your custom message here
                            input.parentNode.insertBefore(newErrorMessage, input.nextSibling);
                        } 
                    } else { 
                        input.classList.remove('is-invalid');
                        const errorMessage = input.nextElementSibling;
                        if (errorMessage && errorMessage.classList.contains('invalid-feedback')) {
                            errorMessage.remove();
                        }
                    }
                });

                if (allValid) {
                    const nextStep = currentStep.nextElementSibling;
                    currentStep.classList.remove('active');
                    nextStep.classList.add('active');
                    currentFormStep++; // Update current form step

                    // *** Update progress bar (added code) ***
                    const progressPercent = ((currentFormStep) / totalFormSteps) * 100;
                    document.querySelector('.progress-bar').style.width = progressPercent + '%';
                }
            });
        });

        prevButtons.forEach(button => {
            button.addEventListener('click', () => {
                const currentStep = button.closest('.form-step');
                const prevStep = currentStep.previousElementSibling;
                currentStep.classList.remove('active');
                prevStep.classList.add('active');
                currentFormStep--; // Update current form step

                // *** Update progress bar (added code) ***
                const progressPercent = ((currentFormStep) / totalFormSteps) * 100;
                document.querySelector('.progress-bar').style.width = progressPercent + '%';

            });
        });

      

            // Function to sanitize input by removing quotes or apostrophes
        function sanitizeInput(input) {
            return input.replace(/["']/g, "");
        }

        // Function to fetch JSON and populate datalist
        function fetchAndPopulateDatalist(jsonFile, datalistId) {
            fetch(jsonFile)
                .then(response => response.json())
                .then(data => {
                    const datalist = document.getElementById(datalistId);
                    const options = data[datalistId]; // Assuming the JSON key matches the datalist ID
                    
                    // Populate the datalist with options as they are (keeping quotes)
                    options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option; // Keep the option exactly as in the JSON (e.g., סמב"צ)
                        datalist.appendChild(optionElement);
                    });
                })
                .catch(error => console.error(`Error loading ${jsonFile}:`, error));
        }

        // Add an event listener to search using sanitized user input
        const roleTypeInput = document.getElementById('roleType');
        roleTypeInput.addEventListener('input', function() {
            const sanitizedValue = sanitizeInput(this.value); // Sanitize user input
            const options = document.querySelectorAll('#roleTypeOptions option');
            
            options.forEach(option => {
                // Sanitize the option value for comparison
                const sanitizedOption = sanitizeInput(option.value);
                
                // Compare sanitized input with sanitized option
                if (sanitizedOption.includes(sanitizedValue)) {
                    option.style.display = ''; // Show the matching option (with quotes)
                } else {
                    option.style.display = 'none'; // Hide non-matching option
                }
            });
        });

        function createNewSession() {
            const roleTypeValue = document.getElementById('roleType').value;
            const unitTypeValue = document.getElementById('unitType').value;
            
            console.log("roleTypeValue:", roleTypeValue);
            console.log("unitTypeValue:", unitTypeValue);
            
            if (!sessionId) {  // Only create a session if one doesn't exist
                // Ensure the fields are populated before proceeding
                if (!roleTypeValue || !unitTypeValue) {
                    alert("Please fill in all the required fields: Role Type and Unit Type.");
                    return;
                }
        
                fetch('https://osimyoter.xyz/bot/api/start_session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        first_name: document.getElementById('firstName').value,
                        last_name: document.getElementById('lastName').value,
                        phone: document.getElementById('phoneNumber').value,
                        idf_role: roleTypeValue,
                        unit_type: unitTypeValue
                    }),
                })
                .then(response => response.json())
                .then(data => {
                    sessionId = data.session_id;
                    console.log("Session started with ID:", sessionId);
        
                    // Change button text to "חזרה לצ'אט"
                    document.getElementById('start-chat-btn').textContent = "חזרה לצ'אט";
                    sendMessage(`אני מחפש לגייס ${adData.position} ביחידת ${adData.uType}. תעזור לי לנסח כישורים נדרשים. תציע לי רשימת כישורים מתאימה, ואז נמשיך עם פרטי היחידה, תנאי השירות, אורך השירות, וגיוס מפטור/מאגר.`);
                    sessionStarted = true; // Mark session as started
        
                })
                .catch(error => console.error('Error:', error));
            } else {
                // Session already exists, just switch to chat screen
                switchToScreen(chatScreen);
            }
        }
        
        function sendMessage(message) {
            const roleTypeValue = adData.position;
            const unitTypeValue = adData.uType;
            
            console.log("Sending message with roleType:", roleTypeValue);
            console.log("Sending message with unitType:", unitTypeValue);
        
            displayMessage(message, 'user-message');

            // Disable send button
            sendBtn.disabled = true;

            // Show typing animation while waiting for AI response
            let typingInterval = startTypingAnimation();
                
            fetch(`https://osimyoter.xyz/bot/api/response/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_q: message,
                    idf_role: roleTypeValue,
                    unit_type: unitTypeValue
                }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch AI response');
                }
                return response.json();
            })
            .then(data => {
                console.log("AI Response:", data);  // Log the full response for debugging
                displayMessage(data.response, 'bot-message');
                updateAdData(data.response);  // Update ad data with the bot response
            })
            .catch(error => {
                console.error('Error:', error);
                displayMessage('Sorry, there was an error processing your request.', 'bot-message');
            })
            .finally(() => {
                // Enable the send button again after receiving the response
                sendBtn.disabled = false;
        
                // Stop typing animation
                clearInterval(typingInterval);
                removeTypingAnimation();
            });

        }

        // Function to display the typing animation
        function startTypingAnimation() {
            let typingMessage = document.createElement('div');
            typingMessage.classList.add('bot-message', 'typing-animation');
            chatArea.appendChild(typingMessage);

            let dots = '';
            let typingIndex = 0;

            const interval = setInterval(() => {
                typingIndex = (typingIndex + 1) % 4;  // Cycle between 0, 1, 2, 3
                dots = '.'.repeat(typingIndex);
                typingMessage.textContent = `כותב${dots}`;
                chatArea.scrollTop = chatArea.scrollHeight;  // Keep chat scrolled to the bottom
            }, 500);

            return interval;
        }

        // Function to remove the typing animation
        function removeTypingAnimation() {
            const typingMessage = document.querySelector('.typing-animation');
            if (typingMessage) {
                typingMessage.remove();
            }
        }
        


        // Fetch and populate role types and unit types
        fetchAndPopulateDatalist('role_types.json', 'roleTypeOptions');
        fetchAndPopulateDatalist('unit_types.json', 'unitTypeOptions');



        function switchToScreen(screenToActivate) {
            const screens = [welcomeScreen, formScreen, chatScreen, verificationScreen, thankYouScreen];
            screens.forEach(screen => {
                if (screen) {
                    screen.classList.remove('active');
                    screen.style.display = 'none'; // Ensures all other screens are hidden
                } else {
                    console.error('Missing screen:', screen); // Logs if any screen is undefined
                }
            });
            if (screenToActivate) {
                screenToActivate.classList.add('active'); // Adds active class to show this screen
                screenToActivate.style.display = 'block'; // Makes sure display property is block
            }
        }
        
        
        // Submit form and show chat screen
        userDetailsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(userDetailsForm);

            // Populate adData with form values
            adData.uType = formData.get('unitType');
            adData.region = formData.get('militaryRegion');
            adData.position = formData.get('roleType');
            adData.serviceLength = formData.get('serviceLength')

            // Validate the form and dates before moving forward
            if (!validateDates()) {
                return;
            }

            // Determine the recruitment period based on the start date
            determineRecruitmentPeriod();

            // get the first name only
            adData.firstName = formData.get('firstName');
            createNewSession();  // This creates the session after form submission

            switchToScreen(chatScreen); // Switch to chat screen

        });

        // Add chat functionality
        const chatArea = document.querySelector('.chat-area');
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        
        sendBtn.addEventListener('click', function() {
            const message = userInput.value.trim();
            if (message) {
                sendMessage(message);
                userInput.value = '';
            }
        });
        
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendBtn.click();
            }
        });

            
        
        function displayMessage(message, className) {
            const messageElement = document.createElement('div');
            messageElement.classList.add(className);
            messageElement.textContent = message;

            // Replace newlines with <br> tags to preserve line breaks
            messageElement.innerHTML = message.replace(/\n/g, '<br>');
            
            chatArea.appendChild(messageElement);
            chatArea.scrollTop = chatArea.scrollHeight;
        }
            
        function updateAdData(botResponse) {
            // Parse the bot response and update adData
            // This is a simple example, you might need more complex parsing based on your bot's responses
            if (botResponse.includes('כישורים נדרשים:')) {
                const skills = botResponse.split('כישורים נדרשים:')[1].split('\n').filter(skill => skill.trim() !== '');
                adData.skills = skills.map(skill => skill.trim());
            }
            // Update the preview
            updateAdPreview(adData);
            checkFormCompletion();

        }


        backToFormBtn.addEventListener('click', function() {
            switchToScreen(formScreen);
        
            // Show the last completed form step
            formSteps.forEach((step, index) => {
                if (index === currentFormStep) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            });
    
        });
            

        // Helper function to fetch data and update adData fields with error handling
        function fetchDataAndUpdate(url, field, placeholder = '???') {
            return fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
                .then(response => response.ok ? response.json() : Promise.reject('Failed to fetch'))
                .then(data => adData[field] = Array.isArray(data) ? data : [data] || [placeholder])
                .catch(error => {
                    console.warn(`Error fetching ${field}:`, error);
                    adData[field] = [placeholder];
                })
                .finally(checkFormCompletion);
        }

        // Preview Modal functionality
        previewBtn.addEventListener('click', function() {
            let formattedStartDate = startDate ? months[startDate.getMonth()] : 'לא ידוע';
            let formattedEndDate = noEndDate.checked ? 'ללא צפי סיום' : endDate ? months[endDate.getMonth()] : 'לא ידוע';

            adData.servicePeriodRange = formattedStartDate === 'לא ידוע' && formattedEndDate === 'לא ידוע'
                ? 'לא ידוע'
                : `${formattedStartDate} - ${formattedEndDate}`;
            
            updateAdPreview(adData);
            previewModal.style.display = 'flex';

            // Fetch required data sequentially
            fetchDataAndUpdate(`https://osimyoter.xyz/bot/api/skills/${sessionId}`, 'skills')
                .then(() => fetchDataAndUpdate(`https://osimyoter.xyz/bot/api/unit_info/${sessionId}`, 'unitDetails'))
                .then(() => fetchDataAndUpdate(`https://osimyoter.xyz/bot/api/service_conditions/${sessionId}`, 'serviceConditions'))
                .then(() => fetchDataAndUpdate(`https://osimyoter.xyz/bot/api/service_length/${sessionId}`, 'serviceLength', '???'))
                .then(() => fetchDataAndUpdate(`https://osimyoter.xyz/bot/api/shalishut_status/${sessionId}`, 'shalishutStatus', '???'))
                .finally(() => {
                    updateAdPreview(adData);
                    checkFormCompletion();
                });
        });


        closeModal.addEventListener('click', function() {
            previewModal.style.display = 'none'; 
        });


        // Update the preview modal content dynamically
        function updateAdPreview(data) {
            // Function to update list content and highlight missing values
            function updateListContent(listId, dataArray) {
            const listElement = document.getElementById(listId);
            listElement.innerHTML = dataArray.map(item => {
                return item ? `<li>** ${item}</li>` : `<li>** <span class="missing">???</span></li>`;
            }).join('');
            }
        
            // Update list content with highlighting
            updateListContent('positions', [data.position]); // Wrap single item in an array
            updateListContent('skills', data.skills);
            updateListContent('unitDetails', data.unitDetails);
            updateListContent('serviceConditions', data.serviceConditions);
        
            // Update other elements in the preview modal with checks for existence

            let serviceLengthElement = document.getElementById('serviceLength');
            if (serviceLengthElement) {
                serviceLengthElement.textContent = data.serviceLength || '???';
            } else {
                console.error("Service Length element not found");
            }

            let shalishutStatusElement = document.getElementById('shalishutStatus');
            if (shalishutStatusElement) {
                shalishutStatusElement.textContent = `${data.shalishutStatus || '⛔ לא רלוונטי לבעלי "פטור" / משוייכים ל"מאגר"'}`;
            } else {
                console.error("Shalishut Status element not found");
            }

            // Update other elements in the preview modal
            document.getElementById('uType').textContent = data.uType || '';
            document.getElementById('region').textContent = data.region || '';
            document.getElementById('servicePeriodRange').textContent = data.servicePeriodRange || '';
            document.getElementById('recruitmentIn').textContent = data.recruitmentIn || '';
            document.getElementById('contact').textContent = `לפרטים נוספים והגשת מועמדות - אנא שלח ל${data.firstName || '?'} הודעת וואטסאפ בה כלולים פרטיך האישיים והמקצועיים הרלוונטיים לתפקיד המבוקש.`;
            document.getElementById('adNumber').textContent = data.adNumber || '';
        }


        // Show the ad-submit button only when required adData fields are completed
        function checkFormCompletion() {
            if (!chatScreen.classList.contains('active')) return; // Only run in the chat screen

            console.log('Checking form completion:', adData); // Log adData to inspect field values

            const requiredFields = [
                'uType', 'region', 'position', 
                'skills', 'unitDetails', 'serviceConditions', 
                'recruitmentIn', 'serviceLength', 'shalishutStatus'
            ];

            const isFormComplete = requiredFields.every(field => {
                const value = adData[field];
                // Check that field is neither empty nor contains '???'
                if (Array.isArray(value)) {
                    return value.length > 0 && value.every(item => item && !item.includes("???"));
                } else {
                    return value && !value.includes("???");
                }
            });


            return isFormComplete; // Return the completeness status
        }



        document.getElementById('approve-ad-btn').addEventListener('click', function() {
            // Check if the form is complete
            if (checkFormCompletion()) {
                // Hide preview modal and show verification modal if complete
                previewModal.style.display = 'none';
                switchToScreen(verificationScreen);

            } else {
                // Display an alert or error message if the form is incomplete
                alert("Please complete all required fields before submitting. Return to the chat!");
            }
        });


        // Call checkFormCompletion whenever adData is updated
        document.querySelector('#user-details-form').addEventListener('input', checkFormCompletion);


        // Move from chat screen to verification screen when "ad-submit-btn" is clicked
        adSubmitBtn.addEventListener('click', function() {
            if (checkFormCompletion()) {
                // Hide the chat screen and show the verification screen
                switchToScreen(verificationScreen);
            } else {
                alert("Please complete all required fields before submitting. Return to the chat!");
            }
        });

        // Move from verification screen to thank you screen when "final-submit-btn" is clicked
        finalSubmitBtn.addEventListener('click', function() {
            // Hide the verification screen and show the thank you screen
            switchToScreen(thankYouScreen);
        });


        // Set up audio recording
        recordBtn.addEventListener('click', async () => {
            recordBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            recordingTimer.style.display = 'block';
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
    
            let startTime = Date.now();
            mediaRecorder.start();
    
            mediaRecorder.addEventListener('dataavailable', (event) => {
                audioBlob = event.data;  // Store the recorded audio blob
                const audioURL = URL.createObjectURL(audioBlob);
                audioPlayback.src = audioURL;
                audioPlayback.style.display = 'inline-block';
            });
    
            // Update the timer while recording
            mediaRecorder.addEventListener('start', () => {
                const timerInterval = setInterval(() => {
                    const seconds = Math.floor((Date.now() - startTime) / 1000);
                    const minutes = Math.floor(seconds / 60);
                    recordingTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    
                    if (mediaRecorder.state === 'inactive') {
                        clearInterval(timerInterval);
                        recordingTimer.style.display = 'none';
                    }
                }, 1000);
            });
        });
    
        // Stop audio recording
        stopBtn.addEventListener('click', () => {
            mediaRecorder.stop();
            recordBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
        });
    
        // Upload the recorded audio and PDF file
        finalSubmitBtn.addEventListener('click', async () => {
            if (!audioBlob || !pdfFileInput.files[0]) {
                alert("Please record audio and upload a PDF before submitting.");
                return;
            }

            // Convert Blob to File with the correct MIME type
            const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });
    
            const formData = new FormData();
            formData.append('audio_file', audioFile); // Use the File object, not the Blob
            formData.append('pdf_file', pdfFileInput.files[0]);      // Append the PDF file
    
            try {
                const response = await fetch(`https://osimyoter.xyz/bot/api/upload_files/${sessionId}`, {
                    method: 'POST',
                    body: formData
                });
    
                if (response.ok) {
                    const data = await response.json();
                    alert(data.message);
                    // Proceed to thank you screen or next step
                    switchToScreen(thankYouScreen);  // Assume you have a function for screen switching
                } else {
                    alert("Failed to upload files. Please try again.");
                }
            } catch (error) {
                console.error('Error uploading files:', error);
            }
        });
    
    

    });