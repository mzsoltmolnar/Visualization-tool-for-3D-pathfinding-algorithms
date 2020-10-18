function UserInterface(uiChangeEvent) {
    const ANIMATION_SPEED_SLIDER_MAX = 200;
    const ANIMATION_SPEED_SLIDER_MIN = 1;

    var DIMENSION_X_MAX = 32;
    var DIMENSION_X_MIN = 3;
    var DIMENSION_Y_MAX = 18;
    var DIMENSION_Y_MIN = 1;
    var DIMENSION_Z_MAX = 18;
    var DIMENSION_Z_MIN = 3;
    var SHOW_LAYER_MIN = 1;

    var dimensionX = 9;
    var dimensionY = 9;
    var dimensionZ = 9;
    var showLayersMax = dimensionY;
    var showLayersMin = DIMENSION_Y_MIN;
    var animationSpeed;

    var isButtonStart = true;
    var isUIElemenstDisabled = false;
    var isTouchScreenEnabled = false;
    /**
     * Add a start point: "addStartPoint"
     * Add an end point: "addEndPoint"
     * Add wall: "addWall"
     */
    var currentMapEditState = "addStartPoint";
    var hideLayersSlider;
    var animationSpeedSlider;

    detectControlType();
    initHideLayersSlider();
    initAnimationSpeedSlider();

    $("#panel-base").on("hide.bs.collapse", bootstrapEventCollapsing);
    $("#panel-base").on("show.bs.collapse", bootstrapEventExpanding);

    $("#buttonXDimensionDecrement").on("click", buttonEventXDimensionDecrement);
    $("#buttonXDimensionIncrement").on("click", buttonEventXDimensionIncrement);

    $("#buttonYDimensionDecrement").on("click", buttonEventYDimensionDecrement);
    $("#buttonYDimensionIncrement").on("click", buttonEventYDimensionIncrement);

    $("#buttonZDimensionDecrement").on("click", buttonEventZDimensionDecrement);
    $("#buttonZDimensionIncrement").on("click", buttonEventZDimensionIncrement);

    $("#buttonOrbitControl").on("click", buttonEventOrbitControl);
    $("#buttonStartPoint").on("click", buttonEventStartPoint);
    $("#buttonEndPoint").on("click", buttonEventEndPoint);
    $("#buttonWallPlace").on("click", buttonEventWallPlace);
    $("#buttonClearWall").on("click", buttonEventClearWall);

    $("#buttonStartPauseAnimation").on("click", buttonEventStartPauseAnimation);
    $("#buttonResetAnimation").on("click", buttonEventResetAnimation);

    updateIndicators();
    setStartStopButtonBaseState();
    setMapEditButtonsBaseState();


    function detectControlType() {
        // source: https://stackoverflow.com/a/20293441/14132176
        try { document.createEvent("TouchEvent"); isTouchScreenEnabled = true; }
        catch (e) { isTouchScreenEnabled = false; }
        // adaptively insert the correct first page of the help modal
        $(document).ready(function () { $("#adaptiveFirstModalPage").load(isTouchScreenEnabled ? "view/mobile_modal.html" : "view/computer_modal.html"); });
    }

    function bootstrapEventCollapsing() {
        $("#panel-base").removeClass("set-panel-vh-max");
    }

    function bootstrapEventExpanding() {
        $("#panel-base").addClass("set-panel-vh-max");
    }

    function buttonEventXDimensionDecrement() {
        if (dimensionX > DIMENSION_X_MIN) {
            dimensionX--;
            let event = "sizeChanged";
            updateIndicators(event);
            uiChangeEvent(event);
        }
    }

    function buttonEventXDimensionIncrement() {
        if (dimensionX < DIMENSION_X_MAX) {
            dimensionX++;
            let event = "sizeChanged";
            updateIndicators(event);
            uiChangeEvent(event);
        }
    }

    function buttonEventYDimensionDecrement() {
        if (dimensionY > DIMENSION_Y_MIN) {
            dimensionY--;
            let event = "sizeChanged";
            updateIndicators(event);
            uiChangeEvent(event);
        }
    }

    function buttonEventYDimensionIncrement() {
        if (dimensionY < DIMENSION_Y_MAX) {
            dimensionY++;
            let event = "sizeChanged";
            updateIndicators(event);
            uiChangeEvent(event);
        }
    }

    function buttonEventZDimensionDecrement() {
        if (dimensionZ > DIMENSION_Z_MIN) {
            dimensionZ--;
            let event = "sizeChanged";
            updateIndicators(event);
            uiChangeEvent(event);
        }
    }

    function buttonEventZDimensionIncrement() {
        if (dimensionZ < DIMENSION_Z_MAX) {
            dimensionZ++;
            let event = "sizeChanged";
            updateIndicators(event);
            uiChangeEvent(event);
        }
    }

    function sliderEventHideLayerSliderSlided() {
        let sliderValues = hideLayersSlider.getValue();
        showLayersMin = sliderValues[0];
        showLayersMax = sliderValues[1];
        let event = "showLayersChanged";
        updateIndicators(event);
        uiChangeEvent(event);
    }

    /** Map edit button event handlers */
    function buttonEventOrbitControl() {
        currentMapEditState = "orbitControl";
        updateMapEditButtons();
        let event = "orbitControlClicked";
        uiChangeEvent(event);
    }

    function buttonEventStartPoint() {
        currentMapEditState = "addStartPoint";
        updateMapEditButtons();
        let event = "mapEdit";
        uiChangeEvent(event);
    }

    function buttonEventEndPoint() {
        currentMapEditState = "addEndPoint";
        updateMapEditButtons();
        let event = "mapEdit";
        uiChangeEvent(event);
    }

    function buttonEventWallPlace() {
        currentMapEditState = "addWall";
        updateMapEditButtons();
        let event = "mapEdit";
        uiChangeEvent(event);
    }

    function buttonEventClearWall() {
        let event = "clearWallClicked";
        uiChangeEvent(event);
    }

    function buttonEventStartPauseAnimation() {
        if (isButtonStart) {
            $("#buttonStartPauseAnimation").html("<svg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-pause-fill' fill='currentColor' xmlns='http://www.w3.org/2000/svg'> <path d='M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z'/> </svg>");
            isButtonStart = false;
            let event = "startClicked";
            uiChangeEvent(event);
        }
        else {
            $("#buttonStartPauseAnimation").html("<svg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-play-fill' fill='currentColor' xmlns='http://www.w3.org/2000/svg'><path d='M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z'/></svg>");
            isButtonStart = true;
            let event = "pauseClicked";
            uiChangeEvent(event);
        }
    }

    function buttonEventResetAnimation() {
        let event = "resetClicked";
        uiChangeEvent(event);
    }

    function sliderEventAnimationSpeedSliderChange() {
        animationSpeed = animationSpeedSlider.getValue();
        let event = "animationSpeedChanged";
        updateIndicators(event);
        uiChangeEvent(event);
    }

    function updateIndicators(event) {
        if (event == "sizeChanged") showLayersMax = dimensionY;
        $("#indicatorXDimension").text(dimensionX.toString());
        $("#indicatorYDimension").text(dimensionY.toString());
        $("#indicatorZDimension").text(dimensionZ.toString());
    }

    function updateMapEditButtons() {
        $("#buttonOrbitControl").removeClass("button-pressed-active");
        $("#buttonStartPoint").removeClass("button-pressed-active");
        $("#buttonEndPoint").removeClass("button-pressed-active");
        $("#buttonWallPlace").removeClass("button-pressed-active");
        if (currentMapEditState === "orbitControl") $("#buttonOrbitControl").addClass("button-pressed-active");
        if (currentMapEditState === "addStartPoint") $("#buttonStartPoint").addClass("button-pressed-active");
        if (currentMapEditState === "addEndPoint") $("#buttonEndPoint").addClass("button-pressed-active");
        if (currentMapEditState === "addWall") $("#buttonWallPlace").addClass("button-pressed-active");
    }

    function updateHideLayersSliderRange() {
        hideLayersSlider.setAttribute("min", SHOW_LAYER_MIN);
        hideLayersSlider.setAttribute("max", dimensionY);
        hideLayersSlider.setAttribute("value", [SHOW_LAYER_MIN, dimensionY]);
        hideLayersSlider.refresh();
        hideLayersSlider.on("change", sliderEventHideLayerSliderSlided);
    }

    function setStartStopButtonBaseState() {
        $("#buttonStartPauseAnimation").html("<svg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-play-fill' fill='currentColor' xmlns='http://www.w3.org/2000/svg'><path d='M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z'/></svg>");
        isButtonStart = true;
    }

    function setMapEditButtonsBaseState() {
        currentMapEditState = "orbitControl";
        updateMapEditButtons();
    }

    function initHideLayersSlider() {
        hideLayersSlider = new Slider("#visible-layers-slider",
            {
                tooltip_position: "bottom",
                tooltip: "always",
                max: dimensionY,
                min: SHOW_LAYER_MIN,
                value: [SHOW_LAYER_MIN, dimensionY],
            });
        hideLayersSlider.refresh();
        hideLayersSlider.on("change", sliderEventHideLayerSliderSlided);
    }

    function initAnimationSpeedSlider() {
        animationSpeedSlider = new Slider("#animation-speed-slider",
            {
                tooltip_position: "bottom",
                tooltip: "hide",
                max: ANIMATION_SPEED_SLIDER_MAX,
                min: ANIMATION_SPEED_SLIDER_MIN,
                value: (ANIMATION_SPEED_SLIDER_MAX + ANIMATION_SPEED_SLIDER_MIN) / 2,
                reversed: true,
            });
        animationSpeedSlider.refresh();
        animationSpeed = animationSpeedSlider.getValue();
        animationSpeedSlider.on("change", sliderEventAnimationSpeedSliderChange)

    }

    this.showHelpModal = function () {
        // $('#helpModalCenter').modal({ show: true });
        prep_modal();
        $("#helpModal").modal("show");
    };

    function prep_modal() {
        $(".modal").each(function () {

            var element = this;
            var pages = $(this).find('.modal-split');

            if (pages.length != 0) {
                pages.hide();
                pages.eq(0).show();

                var b_button = document.createElement("button");
                b_button.setAttribute("type", "button");
                b_button.setAttribute("class", "rectangle-button-68-42 button-colors");
                b_button.setAttribute("style", "display: none;");
                b_button.innerHTML = "Back";

                var n_button = document.createElement("button");
                n_button.setAttribute("type", "button");
                n_button.setAttribute("class", "rectangle-button-68-42 button-colors help-modal-buttons");
                n_button.innerHTML = "Next";

                $(this).find(".help-modal-control-buttons").append(b_button).append(n_button);

                var page_track = 0;

                $(n_button).click(function () {                    
                    this.blur();
                    if (page_track == 0) {
                        $(b_button).show();
                    }
                    if (page_track == pages.length - 2) {
                        $(n_button).text("Close");

                    }
                    if (page_track == pages.length - 1) {
                        $(element).find("form").submit();
                        n_button.setAttribute("data-dismiss", "modal");
                    }
                    if (page_track < pages.length - 1) {
                        page_track++;

                        pages.hide();
                        pages.eq(page_track).show();
                    }
                    $("#helpModalBody").scrollTop(0);
                });

                $(b_button).click(function () {                    
                    if (page_track == 1) {
                        $(b_button).hide();
                    }

                    if (page_track == pages.length - 1) {
                        $(n_button).text("Next");
                        n_button.removeAttribute("data-dismiss");
                    }

                    if (page_track > 0) {
                        page_track--;

                        pages.hide();
                        pages.eq(page_track).show();
                    }
                    $("#helpModalBody").scrollTop(0);

                });

            }

        });
    }

    this.isTouchEnabled = function () {
        return isTouchScreenEnabled;
    };

    this.getCurrentlySelectedAlgorithm = function () {
        return $("#algorithm-dropdown").val();
    };

    this.getMaxDimensions = function () {
        return {
            x: DIMENSION_X_MAX,
            y: DIMENSION_Y_MAX,
            z: DIMENSION_Z_MAX
        };
    };

    this.setMaxDimensions = function (dimensions) {
        DIMENSION_X_MAX = dimensions.x;
        DIMENSION_Y_MAX = dimensions.y;
        DIMENSION_Z_MAX = dimensions.z;
    };

    this.getCurrentDimensions = function () {
        return {
            x: dimensionX,
            y: dimensionY,
            z: dimensionZ
        }
    };

    this.getVisibleLayerRange = function () {
        return {
            min: showLayersMin,
            max: showLayersMax
        };
    };

    this.getCurrentMapEditState = function () {
        /**
         * Add a start point: "addStartPoint"
         * Add an end point: "addEndPoint"
         * Add wall: "addWall"
         */
        return currentMapEditState;
    };

    this.getIsMapEditEnabledState = function () {
        return isMapEditActive;
    };

    this.getAnimationSpeedSliderValue = function () {
        return animationSpeed;
    };

    this.disableUIElements = function (disable) {
        $("#algorithm-dropdown").attr("disabled", disable);
        $("#buttonXDimensionDecrement").attr("disabled", disable);
        $("#buttonXDimensionIncrement").attr("disabled", disable);
        $("#buttonYDimensionDecrement").attr("disabled", disable);
        $("#buttonYDimensionIncrement").attr("disabled", disable);
        $("#buttonZDimensionDecrement").attr("disabled", disable);
        $("#buttonZDimensionIncrement").attr("disabled", disable);
        $("#buttonStartPoint").attr("disabled", disable);
        $("#buttonEndPoint").attr("disabled", disable);
        $("#buttonWallPlace").attr("disabled", disable);
        $("#buttonClearWall").attr("disabled", disable);

        if (disable) {
            buttonEventOrbitControl();
        }

        isUIElemenstDisabled = disable;
    };

    this.getUIElementsDisabledState = function () {
        return isUIElemenstDisabled;
    };

    this.setStartStopButtonBaseState = setStartStopButtonBaseState;
    this.setMapEditButtonsBaseState = setMapEditButtonsBaseState;
    this.updateHideLayersSliderRange = updateHideLayersSliderRange;
}