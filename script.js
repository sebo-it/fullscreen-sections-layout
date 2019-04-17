import { Section } from "./Section.class.js";

document.addEventListener("DOMContentLoaded", () => {

    /*
        Whole page-section layout. 
        It uses arrow buttons, scroll wheel, UI dots, UI menu,
        mouse-swipe and hash URL to navigate between sections.

        Each navigation goes through hash URL, so if I would relocate I should use:
        location.hash = "#" + VsectionIndex;
        location.hash = "#" + VsectionIndex + "/" + subSectionIndex;

        Section indexes, notation rules: 
        - in code, I use programmer notation - 0, 1, 2...
        - in places visible by users, I use user-friendly notation - 1, 2, 3 ... 

    */

    const instructionsWrapper = document.getElementById("instructions");
    const instructionCloseBtn = instructionsWrapper.querySelector("#close-instructions-popup-btn");
    instructionCloseBtn.addEventListener("click", closeInstructions);
    const instructionsData = [
        { "imageSrc": "assets/images/scroll-tip.svg", "imageAlt": "Navigation by scroll wheel tip", "text": "scroll wheel" },
        { "imageSrc": "assets/images/swipe-tip.svg", "imageAlt": "Navigation by drag and drop tip", "text": "swipe by mouse on desktop (drag and drop)" },
        { "imageSrc": "assets/images/arrow-icons-tip.svg", "imageAlt": "Navigation by arrow icons", "text": "arrow icons" },
        { "imageSrc": "assets/images/arrow-keyboard-tip.svg", "imageAlt": "Navigation by arrow on keyboard", "text": "arrow buttons on keyboard" },
        { "imageSrc": "assets/images/ui-dots-tip.svg", "imageAlt": "Navigation by navigation dots", "text": "dots" },
        { "imageSrc": "assets/images/left-menu-tip.svg", "imageAlt": "Navigation by menu links", "text": "left menu links buttons" }

    ];
    let currentInstructionIndex = 0;
    const instructionPhoto = instructionsWrapper.querySelector("#instruction-photo");
    const instructionDescription = instructionsWrapper.querySelector("#instruction-description");
    const prevInstructionBtn = instructionsWrapper.querySelector("#previous-instruction-arrow");
    const nextInstructionBtn = instructionsWrapper.querySelector("#next-instruction-arrow");

    prevInstructionBtn.addEventListener("click", showPrevInstruction);
    nextInstructionBtn.addEventListener("click", showNextInstruction);
    const changeInstructionEvent = new CustomEvent('changeInstruction', { bubbles: true, cancelable: true });
    instructionsWrapper.addEventListener("changeInstruction", changeInstructionEventHandler);
    instructionsWrapper.dispatchEvent(changeInstructionEvent);

    //sectionsWrapper - Main sections container. On this object I will use translateY to show specific vertical section.
    const sectionsWrapper = document.getElementById("sections-wrapper");

    //sections - to check sections quantity and choose one to display
    const sections = createSectionsObj();

    // Vindex = vertical index
    // Hindex = horizontal index
    const currentSection = {
        Vindex: null,
        Hindex: null,
        HTMLObj: null
    }

    const menu = document.getElementById("links-menu");
    const verticalDotsWrapper = document.getElementById("vertical-dots-wrapper");
    let verticalDotsList;
    const horizontalDotsWrapper = document.getElementById("horizontal-dots-wrapper");
    let horizontalDotsList;

    const topArrowBtn = document.getElementById("top-arrow-wrapper");
    const leftArrowBtn = document.getElementById("left-arrow-wrapper");
    const rightArrowBtn = document.getElementById("right-arrow-wrapper");
    const bottomArrowBtn = document.getElementById("bottom-arrow-wrapper");

    const leftColumn = document.getElementById("left-col");
    const leftColOpenerBtn = document.getElementById("left-col-opener");

    let isKeyboardButtonPressedFlag = false;

    // swipeDirection can be:
    // null - actual there is no swipe. I manually set null on mouseup
    // "vertical" - current swipe direction is vertical
    // "horizontal" - current swipe direction is horizontal
    let swipeDirection = null;
    let isSwipeProcessingFlag = false;

    //swipeStartCoordinates - X/Y position for first mouse / touch.
    let swipeStartCoordinates = {
        x: null,
        y: null
    };

    const topArrowBtnVisibilityEvent = new CustomEvent('setVisibilityTopArrow', { bubbles: true, cancelable: true });
    const leftArrowBtnVisibilityEvent = new CustomEvent('setVisibilityLeftArrow', { bubbles: true, cancelable: true });
    const rightArrowBtnVisibilityEvent = new CustomEvent('setVisibilityRightArrow', { bubbles: true, cancelable: true });
    const bottomArrowBtnVisibilityEvent = new CustomEvent('setVisibilityBottomArrow', { bubbles: true, cancelable: true });

    const changeDotEvent = new CustomEvent('setActiveDot', { bubbles: true, cancelable: true });

    // Flag:
    // false - user can change section,
    // true - section is changing, block listeners,
    let processAnimationFlag = false;

    const leftColCloseBtn = document.getElementById("close-left-col-btn");

    // check if localstorage is turn on and check if user read an instruction.
    try {
        if (window.localStorage) {
            console.log("localStorage on");
            const instructionVisitedFlag = localStorage.getItem('instruction_was_displayed_in_the_past');
            if (instructionVisitedFlag === null) {
                console.log('show instruction popup and set flag');
                instructionsWrapper.classList.add("instruction-popup-display");
                instructionsWrapper.classList.remove("display-none");
                localStorage.setItem('instruction_was_displayed_in_the_past', '1')
            }
        }
    } catch (error) {
        console.log("localStorage off");
        instructionsWrapper.classList.add("instruction-popup-display");
    }

    topArrowBtn.addEventListener('setVisibilityTopArrow', setVisibilityTopArrowEventHandler);
    leftArrowBtn.addEventListener('setVisibilityLeftArrow', setVisibilityLeftArrowEventHandler);
    rightArrowBtn.addEventListener('setVisibilityRightArrow', setVisibilityRightArrowEventHandler);
    bottomArrowBtn.addEventListener('setVisibilityBottomArrow', setVisibilityBottomArrowEventHandler);

    initLinksMenu();
    initVerticalDots();

    navigateByURL();

    // To avoid situation, when section doesn't cover full screen after resize window.
    window.addEventListener('resize', resizeWindowHandler);

    topArrowBtn.addEventListener("click", tryGoUp);
    leftArrowBtn.addEventListener("click", tryGoLeft);
    rightArrowBtn.addEventListener("click", tryGoRight);
    bottomArrowBtn.addEventListener("click", tryGoDown);


    /* SectionsWrapper has mousedown and mousemove to start and perform swipe only when use
     clicks and drag cursor on section.
     Mouseup is assign to document, to catch all mouseUp even if it is out of site area. It solves
     problem when swipe starts on page and end with cursor out of it (then mouseup assign to sectionsWrapper
     doesn't trigger).  
    */
    if ("ontouchstart" in document.documentElement) {
        console.log("your device is a touch screen device.");
        leftColOpenerBtn.classList.add("left-col-opener-mobile-position");
        topArrowBtn.classList.add("top-arrow-wrapper-mobile-position");
        leftArrowBtn.classList.add("left-arrow-wrapper-mobile-position");
        rightArrowBtn.classList.add("right-arrow-wrapper-mobile-position");
        bottomArrowBtn.classList.add("bottom-arrow-wrapper-mobile-position");
    }
    else {
        console.log("your device is NOT a touch device");
        
        window.addEventListener('keydown', keydownEventHandler);
        window.addEventListener('keyup', keyUpEventHandler);
        document.addEventListener('wheel', scrollWheelHandler);

        sectionsWrapper.addEventListener("mousedown", startSwipeByMouse);
        sectionsWrapper.addEventListener('mousemove', moveSectionWithMouse);
        document.addEventListener('mouseup', finishSwipeByMouse);
    
        document.addEventListener("touchstart", startSwipeByTouch);
        document.addEventListener("touchmove", touchMoveEventHandler);
        document.addEventListener("touchend", touchEndEventHandler);
    }

    window.addEventListener("hashchange", navigateByURL);

    leftColOpenerBtn.addEventListener("click", openLeftCol);
    leftColCloseBtn.addEventListener("click", closeLeftCol);

    //////////////////////////FUNCTIONS///////////////////////

    function changeInstructionEventHandler(changeInstructionEvent) {
        changeInstructionEvent.stopPropagation();

        instructionPhoto.src = instructionsData[currentInstructionIndex].imageSrc;
        instructionPhoto.alt = instructionsData[currentInstructionIndex].imageAlt;
        instructionDescription.textContent = instructionsData[currentInstructionIndex].text;
    }

    function showPrevInstruction() {
        if (currentInstructionIndex > 0) {
            currentInstructionIndex--;
        } else if (currentInstructionIndex == 0) {
            currentInstructionIndex = instructionsData.length - 1;
        }

        instructionsWrapper.dispatchEvent(changeInstructionEvent);
    }

    function showNextInstruction() {
        if (currentInstructionIndex < instructionsData.length - 1) {
            currentInstructionIndex++;
        } else if (currentInstructionIndex == instructionsData.length - 1) {
            currentInstructionIndex = 0;
        }

        instructionsWrapper.dispatchEvent(changeInstructionEvent);
    }

    function closeInstructions() {
        fadeOut(instructionsWrapper, 600, () => {
            instructionsWrapper.style.opacity = "1";
            instructionsWrapper.classList.remove("instruction-popup-display");
            instructionsWrapper.classList.add("display-none");
        });
    }

    function createSectionsObj() {
        const returningSectionsArr = [];
        const sectionsHTMLCollection = document.querySelectorAll(".section");
        for (let i = 0; i < sectionsHTMLCollection.length; i++) {
            const currentSection = sectionsHTMLCollection[i];
            const subSectionsArr = currentSection.getElementsByClassName("sub-section");
            const sectionObj = new Section(currentSection, subSectionsArr, null);
            returningSectionsArr.push(sectionObj);
        }

        // console.log(returningSectionsArr);

        return returningSectionsArr;
    };

    function initLinksMenu() {
        for (let i = 0; i < sections.length; i++) {
            const link = document.createElement("a");
            link.className = "link";
            link.textContent = "section-" + (i + 1);

            if (sections[i].subSections.length > 0) {
                link.href = "#" + (i + 1) + '/' + '1';
            } else {
                link.href = "#" + (i + 1);
            }

            menu.appendChild(link);
        }
    }

    /**
     * create div's, one per dot and assign listener
     * assing new dots to variable
     * add custom listener to dots container
     */
    function initVerticalDots() {
        for (let i = 0; i < sections.length; i++) {
            const dot = document.createElement("a");
            dot.className = "dot";

            if (sections[i].subSections.length > 0) {
                dot.href = "#" + (i + 1) + '/' + '1';
            } else {
                dot.href = "#" + (i + 1);
            }

            verticalDotsWrapper.appendChild(dot);
        }
        verticalDotsList = verticalDotsWrapper.querySelectorAll(".dot");
        verticalDotsWrapper.addEventListener('setActiveDot', setActiveDotEventHandler);
    }

    function setHorizontalDots() {
        if (currentSection.Hindex !== null) {

            // remove previous dots
            while (horizontalDotsWrapper.firstChild) {
                horizontalDotsWrapper.removeChild(horizontalDotsWrapper.firstChild);
            }

            for (let i = 0; i < sections[currentSection.Vindex].subSections.length; i++) {
                const dot = document.createElement("div");
                dot.className = "dot";

                dot.addEventListener("click", () => {
                    if (!processAnimationFlag) {
                        location.hash = "#" + (currentSection.Vindex + 1) + "/" + (i + 1);
                    }
                });

                horizontalDotsWrapper.appendChild(dot);
            }

            horizontalDotsList = horizontalDotsWrapper.querySelectorAll(".dot");
            horizontalDotsWrapper.style.visibility = "visible";
            horizontalDotsWrapper.addEventListener('setActiveDot', setActiveDotEventHandler);
        } else {
            horizontalDotsWrapper.style.visibility = "hidden";
        }
    }

    /**
     * read URL, extract hash,
     * check correctness 
     * relocation ( wrong hash = go to first section )
     * 
     * navigateByURL has internal function goToSection
     */
    function navigateByURL() {
        const targetIndexesObj = getTargetIndexes();
        goToSection(targetIndexesObj);

        //============SUB FUNCTIONS===========

        /**
         * Function get url hash, extract it, check correctness and set target indexes to returning obj.
         * Returns 
         * {
         *  Vindex - when number is incorrect, Vindex = 0 (first section),
         *  Hindex - null, when subsection isn't exist (wrong value) or it's neccessary (casual vertical section)
         * }
         */
        function getTargetIndexes() {
            const URLHashValue = location.hash.slice(1);
            const indexesArr = URLHashValue.split('/');
            indexesArr[0] = parseInt(indexesArr[0]);
            indexesArr[1] = parseInt(indexesArr[1]);

            const targetIndexes = {
                Vindex: indexesArr[0],
                Hindex: indexesArr[1]
            };

            //check and set Vindex
            if (Number.isInteger(targetIndexes.Vindex) && targetIndexes.Vindex > 0 && targetIndexes.Vindex <= sections.length) {
                targetIndexes.Vindex = targetIndexes.Vindex - 1;
            } else {
                targetIndexes.Vindex = 0;
            }

            //check and set Hindex
            if (Number.isInteger(targetIndexes.Hindex) && targetIndexes.Hindex > 0 && targetIndexes.Hindex <= sections[targetIndexes.Vindex].subSections.length) {
                targetIndexes.Hindex = targetIndexes.Hindex - 1;
            } else {
                targetIndexes.Hindex = null;
            }

            return targetIndexes;
        }

        /**
         * Relocation with animation.
         * Count needed parameters to show animation.
         * Trigger events to update relocation.
         *
         * @param {*} targetSectionIndex
         */
        function goToSection(targetIndexesObj) {
            const sectionBeforeChange = Object.assign({}, currentSection);
            const sourceTranslation = getTranslate(sectionsWrapper);

            currentSection.Vindex = targetIndexesObj.Vindex;
            currentSection.Hindex = targetIndexesObj.Hindex === null ? null : targetIndexesObj.Hindex;
            if (targetIndexesObj.Hindex === null) {
                currentSection.HTMLObj = sections[targetIndexesObj.Vindex].HTMLel;
            } else {
                currentSection.HTMLObj = sections[targetIndexesObj.Vindex].subSections[targetIndexesObj.Hindex];
                sections[targetIndexesObj.Vindex].lastSubSectionIndex = targetIndexesObj.Hindex;
            }

            if (sectionBeforeChange.Vindex !== currentSection.Vindex && sectionBeforeChange.Hindex !== currentSection.Hindex) {
                console.log('change vertical and horizontal section');

                const targetYTranslation = -1 * currentSection.HTMLObj.offsetTop;

                //animDistanceY is distance and direction in one, so it can be negative too
                const animDistanceY = targetYTranslation - sourceTranslation.translateY;

                // animTime = 400 for faster animation when user use swipe
                const animTime = Math.abs(animDistanceY) < currentSection.HTMLObj.clientHeight ? 400 : 600;

                if (targetIndexesObj.Hindex === null) {
                    animateTranslate(sectionsWrapper, animTime, sourceTranslation.translateX, 0, sourceTranslation.translateY, animDistanceY, null);
                } else {
                    animateTranslate(sectionsWrapper, animTime, sourceTranslation.translateX, 0, sourceTranslation.translateY, animDistanceY, () => {
                        const hSectionsContainer = sections[targetIndexesObj.Vindex].HTMLel;
                        const targetHSection = hSectionsContainer.getElementsByClassName("sub-section")[targetIndexesObj.Hindex];
                        const distance = targetHSection.offsetLeft - hSectionsContainer.scrollLeft;
                        animateScroll(hSectionsContainer, "scrollLeft", 800, hSectionsContainer.scrollLeft, distance, null);
                    });
                }
                setHorizontalDots();
            } else if (sectionBeforeChange.Vindex !== currentSection.Vindex) {
                console.log('change vertical section');
                const targetYTranslation = -1 * currentSection.HTMLObj.offsetTop;

                //animDistanceY is distance and direction in one, so it can be negative too
                const animDistanceY = targetYTranslation - sourceTranslation.translateY;

                // animTime = 400 for faster animation when user use swipe
                const animTime = Math.abs(animDistanceY) < currentSection.HTMLObj.clientHeight ? 400 : 600;
                animateTranslate(sectionsWrapper, animTime, sourceTranslation.translateX, 0, sourceTranslation.translateY, animDistanceY, null);
                setHorizontalDots();
            } else if (sectionBeforeChange.Hindex !== currentSection.Hindex) {
                console.log('change only horizontal');

                const hSectionsContainer = sections[targetIndexesObj.Vindex].HTMLel;
                const targetHSection = hSectionsContainer.getElementsByClassName("sub-section")[targetIndexesObj.Hindex];
                const distance = targetHSection.offsetLeft - hSectionsContainer.scrollLeft;
                animateScroll(hSectionsContainer, "scrollLeft", 800, hSectionsContainer.scrollLeft, distance, null);

            }

            // const targetYTranslation = -1 * currentSection.HTMLObj.offsetTop;

            // //animDistanceY is distance and direction in one, so it can be negative too
            // const animDistanceY = targetYTranslation - sourceTranslation.translateY;

            // // animTime = 200 for faster animation when user use swipe
            // const animTime = Math.abs(animDistanceY) < currentSection.HTMLObj.clientHeight ? 200 : 600;

            // if (targetIndexesObj.Hindex === null) {
            //     animateTranslate(sectionsWrapper, animTime, sourceTranslation.translateX, 0, sourceTranslation.translateY, animDistanceY, null);
            // } else {
            //     animateTranslate(sectionsWrapper, animTime, sourceTranslation.translateX, 0, sourceTranslation.translateY, animDistanceY, () => {
            //         const hSectionsContainer = sections[targetIndexesObj.Vindex].HTMLel;
            //         const targetHSection = hSectionsContainer.getElementsByClassName("sub-section")[targetIndexesObj.Hindex];
            //         const distance = targetHSection.offsetLeft - hSectionsContainer.scrollLeft;
            //         animateScroll(hSectionsContainer, "scrollLeft", 800, hSectionsContainer.scrollLeft, distance, null);
            //     });
            // }

            verticalDotsWrapper.dispatchEvent(changeDotEvent);
            horizontalDotsWrapper.dispatchEvent(changeDotEvent);
            topArrowBtn.dispatchEvent(topArrowBtnVisibilityEvent);
            leftArrowBtn.dispatchEvent(leftArrowBtnVisibilityEvent);
            rightArrowBtn.dispatchEvent(rightArrowBtnVisibilityEvent);
            bottomArrowBtn.dispatchEvent(bottomArrowBtnVisibilityEvent);
        }

    }

    /**
     * Universal function to animate translation on separate coordinate x/y or both in same time.
     * 
     * @param {*} elementHTML 
     * @param {*} duration 
     * @param {*} startTranslateX 
     * @param {*} distanceX Can be positive or negative too.
     * @param {*} startTranslateY 
     * @param {*} distanceY Can be positive or negative too.
     */
    function animateTranslate(elementHTML, duration, startTranslateX, distanceX, startTranslateY, distanceY, onCompleteFn) {
        processAnimationFlag = true;
        // console.log('Animation start');

        let start = performance.now();

        requestAnimationFrame(function animate(time) {
            // timeFraction goes from 0 to 1
            let timeFraction = (time - start) / duration;
            if (timeFraction > 1) timeFraction = 1;

            // timeFraction can be math function to make different effect then linear
            const progress = timeFraction;

            const translationX = distanceX * progress + startTranslateX;
            const translationY = distanceY * progress + startTranslateY;
            elementHTML.style.transform = `translate(${translationX}px, ${translationY}px)`;

            if (timeFraction < 1) {
                requestAnimationFrame(animate);
            } else {
                // console.log('Animation completed');
                processAnimationFlag = false;
                // Resize window here, solve problem which occur when resizing window and animation happen at the same time.
                typeof onCompleteFn === "function" && onCompleteFn();
                resizeWindowHandler();
            }

        });
    }

    /**
     * Section translate have to be fit after resizing window, to cover whole page.
     */
    function resizeWindowHandler() {
        sectionsWrapper.style.transform = `translateY(-${currentSection.HTMLObj.offsetTop}px)`;
    }

    function animateScroll(elementHTML, property, duration, startPosition, distance, onCompleteFn) {
        processAnimationFlag = true;
        // console.log('Animation start');

        let start = performance.now();

        requestAnimationFrame(function animate(time) {
            // timeFraction goes from 0 to 1
            let timeFraction = (time - start) / duration;
            if (timeFraction > 1) timeFraction = 1;

            // timeFraction can be math function to make different effect then linear
            const progress = timeFraction;

            const scroll = distance * progress + startPosition;
            elementHTML[property] = scroll;

            if (timeFraction < 1) {
                requestAnimationFrame(animate);
            } else {
                // console.log('Animation completed');
                processAnimationFlag = false;
                // Resize window here, solve problem which occur when resizing window and animation happen at the same time.
                resizeWindowHandler();
                typeof onCompleteFn === 'function' && onCompleteFn();
            }

        });
    };


    function scrollWheelHandler(event) {
        if (event.deltaY < 0) tryGoUp();
        if (event.deltaY > 0) tryGoDown();
    };

    function setActiveDotEventHandler() {
        const dotsWrapper = this;
        const currentActiveDot = dotsWrapper.querySelector(".dot-active");
        if (currentActiveDot) currentActiveDot.classList.remove("dot-active");
        const direction = dotsWrapper.getAttribute("direction");
        if (direction === "vertical") {
            verticalDotsList[currentSection.Vindex].classList.add("dot-active");
        } else if (direction === "horizontal" && currentSection.Hindex !== null) {
            horizontalDotsList[currentSection.Hindex].classList.add("dot-active");
        }

    }

    function setVisibilityTopArrowEventHandler(event) {
        event.stopPropagation();

        if (currentSection.Vindex === 0) {
            topArrowBtn.style.visibility = 'hidden';
        } else {
            topArrowBtn.style.visibility = 'visible';
        }
    }

    function setVisibilityLeftArrowEventHandler(event) {
        event.stopPropagation();

        if (currentSection.Hindex === null || currentSection.Hindex === 0) {
            leftArrowBtn.style.visibility = 'hidden';
        } else {
            leftArrowBtn.style.visibility = 'visible';
        }
    }

    function setVisibilityRightArrowEventHandler(event) {
        event.stopPropagation();

        if (currentSection.Hindex === null || currentSection.Hindex === sections[currentSection.Vindex].subSections.length - 1) {
            rightArrowBtn.style.visibility = 'hidden';
        } else {
            rightArrowBtn.style.visibility = 'visible';
        }
    }

    function setVisibilityBottomArrowEventHandler(event) {

        event.stopPropagation();

        if (currentSection.Vindex === sections.length - 1) {
            bottomArrowBtn.style.visibility = 'hidden';
        } else {
            bottomArrowBtn.style.visibility = 'visible';
        }
    }

    function tryGoLeft() {
        if (sections[currentSection.Vindex].subSections.length !== 0 && currentSection.Hindex > 0 && !processAnimationFlag) {
            location.hash = "#" + (currentSection.Vindex + 1) + "/" + currentSection.Hindex;
        }
    }

    /**
     * tryGoUp - it checks whether user would go out of section range in negative side.
     * It is one operation function, to avoid duplicate condition
     * in each type of listener assign (buttons, keyboard).
     */
    function tryGoUp() {
        if (currentSection.Vindex > 0 && !processAnimationFlag) {
            const upperSectionLastHindex = sections[currentSection.Vindex - 1].lastSubSectionIndex;

            if (sections[currentSection.Vindex - 1].subSections.length !== 0) {
                //upper section has subsections
                if (sections[currentSection.Vindex - 1].lastSubSectionIndex !== null) {
                    //upper section has last visited subsection index
                    location.hash = "#" + currentSection.Vindex + "/" + (upperSectionLastHindex + 1);
                } else {
                    //upper section hasn't visited yet
                    location.hash = "#" + currentSection.Vindex + "/" + 1;
                }
            } else {
                //upper section is only vertical
                location.hash = "#" + currentSection.Vindex;
            }

        }
    }

    function tryGoRight() {
        if (sections[currentSection.Vindex].subSections.length !== 0 && currentSection.Hindex < sections[currentSection.Vindex].subSections.length - 1 && !processAnimationFlag) {
            location.hash = "#" + (currentSection.Vindex + 1) + "/" + (currentSection.Hindex + 2);
        }
    }

    /**
     * tryGoDown - it checks whether user would go out of section range in positive side.
     * It is one operation function, to avoid duplicate condition
     * in each type of listener assign (buttons, keyboard).
     */
    function tryGoDown() {
        if (currentSection.Vindex < sections.length - 1 && !processAnimationFlag) {
            const lowerSectionLastHindex = sections[currentSection.Vindex + 1].lastSubSectionIndex;

            if (sections[currentSection.Vindex + 1].subSections.length !== 0) {
                //lower section has subsections
                if (sections[currentSection.Vindex + 1].lastSubSectionIndex !== null) {
                    //upper section has last visited subsection index
                    location.hash = "#" + (currentSection.Vindex + 2) + "/" + (lowerSectionLastHindex + 1);
                } else {
                    //lower section hasn't visited yet
                    location.hash = "#" + (currentSection.Vindex + 2) + "/" + 1;
                }
            } else {
                //upper section is only vertical
                location.hash = "#" + (currentSection.Vindex + 2);
            }

        }
    }

    function keydownEventHandler(event) {
        event.preventDefault();
        if (isKeyboardButtonPressedFlag === false) {
            isKeyboardButtonPressedFlag = true;

            switch (event.keyCode) {
                case 37:
                    tryGoLeft();
                    break;

                case 38:
                    tryGoUp();
                    break;

                case 39:
                    tryGoRight();
                    break;

                case 40:
                    tryGoDown();
                    break;

            }
        }
    }

    function keyUpEventHandler() {
        isKeyboardButtonPressedFlag = false;
    };

    function clearSelection() {
        //clear text selection if it exists
        if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) {  // Firefox
                window.getSelection().removeAllRanges();
            }
        } else if (document.selection) {  // IE?
            document.selection.empty();
        }
    }

    function startSwipeByTouch(touchEvent) {
        if (touchEvent.targetTouches.length === 1) {
            clearSelection();
            swipeStartCoordinates.x = Math.round(touchEvent.targetTouches[0].pageX);
            swipeStartCoordinates.y = Math.round(touchEvent.targetTouches[0].pageY);
        }
    };

    function touchMoveEventHandler(touchEvent) {
        if (touchEvent.targetTouches.length === 1) {
            const touchPositionY = touchEvent.targetTouches[0].pageY;
            moveSectionWithPointer(touchPositionY);
        }
    };

    function touchEndEventHandler(touchEvent) {
        // Remove all touches should fire if. Condition didn't test.
        if (touchEvent.targetTouches.length === 0) {
            const touchObj = touchEvent.changedTouches[0];
            finishSwipe(touchObj.pageY);
        }
    };

    /**
     * It reacts only on LMB. 
     * After click, it clears selection to avoid moving selected text instead of swipe section.
     * Save mouse click position to object.
     * @param {*} event MouseEvent
     */
    function startSwipeByMouse(event) {
        console.log('mousedown triggered');

        if (event.buttons === 1) {
            isSwipeProcessingFlag = true;
            clearSelection();
            swipeStartCoordinates.x = event.pageX;
            swipeStartCoordinates.y = event.pageY;
        }
    }

    /**
     * It react on mousemove with LMB pressed and stick section to mouse.
     * It works if temporary translation doesn't go outside website content.
     * 
     * @param {*} event MouseEvent
     */
    function moveSectionWithMouse(event) {
        console.log('mousemove triggered');

        if (event.buttons === 1 && isSwipeProcessingFlag === true) {
            if (swipeDirection === null) {
                console.log(event.pageX, event.pageX);
                // set swipe direction
                const firstMoveCoordinates = {
                    x: event.pageX,
                    y: event.pageY
                };

                const distance = {
                    x: Math.abs(firstMoveCoordinates.x - swipeStartCoordinates.x),
                    y: Math.abs(firstMoveCoordinates.y - swipeStartCoordinates.y)
                };

                if (distance.x > distance.y) {
                    swipeDirection = "horizontal";
                } else {
                    swipeDirection = "vertical";
                }

            }

            if (swipeDirection === "vertical") {
                moveSectionWithPointer(event.pageY);
            } else {
                // case: swipeDirection === "horizontal" 
                scrollSectionWithPointer(event.pageX);
            }

        }
    }

    /**
     * If user release LMB, function check distance between whole process LMB -> move + LMB -> release LMB
     * If distance is greater than or equal to ~15% of section height it checks possibility to switch section.
     * If distance is lower, it centered current section, using animation.
     *
     * @param {*} event MouseEvent
     */
    function finishSwipeByMouse(event) {
        if (event.button === 0 && isSwipeProcessingFlag === true) {
            console.log('mouseUp triggered');
            console.log('swipe direction', swipeDirection);

            if (swipeDirection === "vertical") {
                finishSwipe(event.pageY);
            } else if (swipeDirection === "horizontal") {
                finishSwipe(event.pageX);
            }

            isSwipeProcessingFlag = false;
            swipeDirection = null;
        }
    }

    /**
     * Function stick section to pointer (mouse / touch) and move it with it.
     * @param {*} cursorPosition cursor pageY position.
     */
    function moveSectionWithPointer(cursorPosition) {
        const moveDistance = cursorPosition - swipeStartCoordinates.y;
        const tempTranslation = -1 * currentSection.HTMLObj.offsetTop + moveDistance;
        const lastSectionTranslationY = -1 * sections[sections.length - 1].HTMLel.offsetTop;

        if (tempTranslation < 0 && tempTranslation > lastSectionTranslationY) {
            sectionsWrapper.style.transform = `translateY(${tempTranslation}px)`;
        }
    }

    function scrollSectionWithPointer(cursorPosition) {
        const scrollContainer = sections[currentSection.Vindex].HTMLel;
        // move < 0 when swipe to the left side of screen 
        // move > 0 when swipe to the right side of screen 
        const move = cursorPosition - swipeStartCoordinates.x;
        // console.log('nn', move, 'scrolContOfL', scrollContainer.scrollLeft);
        console.log(currentSection.HTMLObj.offsetWidth, currentSection.Hindex, scrollContainer.scrollLeft, move);

        // const scrlLeft = -1 * scrollContainer.scrollLeft + move;
        console.log('move', move);

        if (move < 0) {
            scrollContainer.scrollLeft += Math.abs(move) / 50;
        } else {
            scrollContainer.scrollLeft -= Math.abs(move) / 50;
        }
        // console.log('scroll left', scrollContainer.scrollLeft);

    }

    /**
     * Check distance between of swipe and decide: change section or center current.
     * @param {*} cursorPosition pointer Y position on release LMB or pick up last finger
     */
    function finishSwipe(cursorPosition) {
        if (swipeDirection === "vertical") {
            const clicksPosYSubtract = cursorPosition - swipeStartCoordinates.y;
            const distanceBetweenClicks = Math.abs(clicksPosYSubtract);
            if (distanceBetweenClicks >= (currentSection.HTMLObj.clientHeight / 7) && clicksPosYSubtract < 0) {
                tryGoDown();
            } else if (distanceBetweenClicks >= (currentSection.HTMLObj.clientHeight / 7) && clicksPosYSubtract > 0) {
                tryGoUp();
            } else {
                // reset offset
                const startAnimTranslation = getTranslate(sectionsWrapper);
                const finishAnimTranslateY = -1 * currentSection.HTMLObj.offsetTop;
                //animDistanceY is distance and direction in one, so it can be negative too
                const animDistanceY = finishAnimTranslateY - startAnimTranslation.translateY;

                // protection against empty animation which take time like setTimeout
                // duration should be small < 1000
                if (animDistanceY !== 0) {
                    animateTranslate(sectionsWrapper, 200, startAnimTranslation.translateX, 0, startAnimTranslation.translateY, animDistanceY, null);
                }
            }
        } else if (swipeDirection === "horizontal") {
            const clicksPosXSubtract = cursorPosition - swipeStartCoordinates.x;
            const distanceBetweenClicks = Math.abs(clicksPosXSubtract);
            if (distanceBetweenClicks >= (currentSection.HTMLObj.clientWidth / 7) && clicksPosXSubtract < 0) {
                tryGoRight();
            } else if (distanceBetweenClicks >= (currentSection.HTMLObj.clientWidth / 7) && clicksPosXSubtract > 0) {
                tryGoLeft();
            } else {
                const hSectionsContainer = currentSection.HTMLObj.parentElement;
                const distance = clicksPosXSubtract > 0 ? distanceBetweenClicks : -1 * distanceBetweenClicks;
                animateScroll(hSectionsContainer, "scrollLeft", 800, hSectionsContainer.scrollLeft, distance, null);
            }
        }
    }

    /**
     * Universal function which return obj with current translation.
     * @param {*} obj HTMLObject
     */
    function getTranslate(obj) {
        const objStyle = window.getComputedStyle(obj);
        const objMatrix = new WebKitCSSMatrix(objStyle.webkitTransform);

        const translateObj = {
            'translateX': objMatrix.m41,
            'translateY': objMatrix.m42
        };

        return translateObj;
    }

    function openLeftCol() {
        leftColumn.style.visibility = "visible";
        fadeIn(leftColumn, 800, null);
    }

    function closeLeftCol() {
        fadeOut(leftColumn, 400, onLeftColClosingComplete);
    }

    function onLeftColClosingComplete() {
        leftColumn.style.visibility = "hidden";
    }

    function fadeIn(elementHTML, duration, onCompleteFn) {
        // console.log('Animation start');

        let start = performance.now();

        requestAnimationFrame(function animate(time) {
            // timeFraction goes from 0 to 1
            let timeFraction = (time - start) / duration;
            if (timeFraction > 1) timeFraction = 1;

            // timeFraction can be math function to make different effect then linear
            const progress = timeFraction;

            elementHTML.style.opacity = progress;

            if (timeFraction < 1) {
                requestAnimationFrame(animate);
            } else {
                // console.log('Animation completed');
                typeof onCompleteFn === 'function' && onCompleteFn();
            }

        });
    }

    function fadeOut(elementHTML, duration, onCompleteFn) {
        // console.log('Animation start');

        let start = performance.now();

        requestAnimationFrame(function animate(time) {
            // timeFraction goes from 0 to 1
            let timeFraction = (time - start) / duration;
            if (timeFraction > 1) timeFraction = 1;

            // timeFraction can be math function to make different effect then linear
            const progress = timeFraction;

            elementHTML.style.opacity = 1 - progress;

            if (timeFraction < 1) {
                requestAnimationFrame(animate);
            } else {
                // console.log('Animation completed');
                typeof onCompleteFn === 'function' && onCompleteFn();
            }

        });
    }

});