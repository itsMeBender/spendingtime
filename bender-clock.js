import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';

/**
 * `bender-clock`
 * displays an analog clock, using local time by default.
 * 
 * Example, current time:
 * 
 * <bender-clock></bender-clock>
 * 
 * ### Styling
 * 
 * The following custom properties and mixins are also available for styling:
 * 
 * Custom property                   | Description                  | Default
 * ----------------------------------|------------------------------|----------
 * `--bender-clock-background-color` | Clock display background     | #000000
 * `--bender-clock-border-color`     | Color of the border border   | #FFFFFF
 * `--bender-clock-border-width`     | Width of the border border   | 4px
 * `--bender-clock-color-hour`       | Color of the hour hand       | #EEEEEE
 * `--bender-clock-color-minute`     | Color of the minute hand     | #EEEEEE
 * `--bender-clock-color-second`     | Color of the seconds hand    | #EEEEEE
 * `--bender-clock-border-radius`    | Radius of the border.        | 5em - round, 0em - square
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class BenderClock extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
        .clock {
          width: 10em;
          height: 10em;
          position: relative;
        }
        .clock--frame {
          border: solid var(--bender-clock-border-width, 4px) var(--bender-clock-border-color, #FFFFFF);
          border-radius: var(--bender-clock-border-radius, 5em); /* Half of the parent size */
          width: inherit; /* use parent .clock */
          height: inherit; /* use parent .clock */
          box-sizing: border-box; /* Includes the border */
          background-color: var(--bender-clock-background-color, #000000);
        }
        .clock--frame,
        .center--frame,
        .hour--frame,
        .hour--full-rotation,
        .minute--frame,
        .minute--full-rotation,
        .second--frame,
        .second--full-rotation {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
        }
        .hour--full-rotation {
          animation: rotate 43200s infinite linear;
        }
        .minute--full-rotation {
          animation: rotate 3600s infinite linear;
        }
        .second--full-rotation {
          animation: rotate 60s infinite steps(60);
        }
        .center {
          position: absolute;
          background-color: var(--bender-clock-color-hour, #EEEEEE);     
          width: 0.6em;
          height: 0.6em;
          transform-origin: 50% 50%; /* The middle of the circle */
          top: 4.7em;
          left: 4.7em;
          border-radius: 0.3em; /* Half of the parent size */
          box-sizing: border-box;
        }
        .hour {
          position: absolute;
          background-color: var(--bender-clock-color-hour, #EEEEEE);
          width: 0.3em;
          height: 2.2em;
          transform-origin: 0 50%;
          bottom: 5em;
          right: 4.85em;
        }
        .minute {
          position: absolute;
          background-color: var(--bender-clock-color-minute, #EEEEEE);
          width: 0.2em;
          height: 3.4em;
          transform-origin: 0 50%;
          bottom: 5em;
          right: 4.9em;
        }
        .second {
          position: absolute;
          background-color: var(--bender-clock-color-second, #EEEEEE);
          width: 0.06em;
          height: 4.5em;
          transform-origin: 0% 50%;
          bottom: 4.3em;
          right: 4.96em;
        }
        @keyframes rotate {
          0%   {transform: rotateZ(0deg)}
          100% {transform: rotateZ(360deg)};
        }
        .digits {
          color: red;
        }
        .digit {
          position: absolute;
          padding: 0.05em;
          transform-origin: 50% 50%;
        }
        .digit--frame {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;        
        }
        .digit--12 {
          top: 0;
          left: 50%;
        }
      </style>
      <div class="clock">
        <div class="clock--frame"><!-- Handles background, border --></div>
        
        <div id="hour--frame" class="hour--frame"><!-- Handles, rotation at start time -->
          <div class="hour--full-rotation"><!-- Handles, the actual time. 1 Hour rotation -->
            <div class="hour"><!-- The HOUR hand rectangle --></div>
          </div>
        </div>
        <div id="minute--frame" class="minute--frame">
          <div class="minute--full-rotation">
            <div class="minute"></div>
          </div>
        </div>
        <div id="second--frame" class="second--frame">
          <div class="second--full-rotation">
            <div class="second"></div>
          </div>
        </div>
        <div class="center"><!-- The center dot, of the hands --></div>
        <div class="digits">
          <div class="digit--full-rotation">
            <!-- <div class="digit digit--12">12</div>  -->
          </div>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      // The start `time` of the clock, default current.
      time: {
        notify: true, // Send event 'time-changed', https://www.polymer-project.org/1.0/docs/devguide/properties
        observer: 'changeTime',
        reflectToAttribute: true, // https://www.polymer-project.org/1.0/docs/devguide/properties#attribute-reflection
        type: String,
        value: '',
      },

      /**
       * Use for one-time configuration of your component after local DOM is
       * initialized.
       */
      ready: () => {
        super.ready();
      }
    };
  }


  /**
   * Change displayed time hands, with format H, H:M, H:M:S as in '1:23:45'
   * @param {String} time to display hands of the clock
   */
  changeTime(time) {
    var clock = new Date();
    var hours;
    var minutes;
    var seconds;
    var that = this;
    var timeParts;

    /**
     * Set the rotation ANGLE of the container frame, identied by a unique CLASSNAME
     * @param {number} angle The calculated ANGLE of the ELEMENT 0..360
     * @param {string} className The unique identifier of the ELEMENT to be rotated
     */
    function setRotationForElement(angle, id) {
      var element = that.$[id]; // = that.getElementsByClassName(className)[0]; // `that` is the element
      element.style.webkitTransform = 'rotateZ('+ angle +'deg)';
      element.style.transform = 'rotateZ('+ angle +'deg)';
    }

    /**
     * Validate if value is an accaptable hour range 0..23 and returns it.
     * @param {string} hours The time in HOURS, 0..23
     * @return {number} Of hours 0..12, 12-hour analog clock
     */
    function validHours(hours) {
      if (isNaN(hours)) {
        throw new Error('Attribute `time` unexpected format hours.', 'bender-clock.html');
      } else {
        hours = parseInt(hours, 10);
        if (hours < 0 || hours > 23) {
          throw new RangeError('Attribute `time` unexpected format hours.', 'bender-clock.html');
        }
      }
      // Convert to 12 hour clock.
      return hours > 12 ? hours - 12 : hours;
    }

    /**
     * Validate if value is an accaptable minute range 0..59 and returns it.
     * @param {string} minutes The time MINUTES, 0..59
     * @return {number} minutes
     */
    function validMinutes(minutes) {
      if (isNaN(minutes)) {
        throw new Error('Attribute `time` unexpected format minutes.', 'bender-clock.html');
      } else {
        minutes = parseInt(minutes, 10);
        if (minutes < 0 || minutes > 59) {
          throw new RangeError('Attribute `time` unexpected format minutes.', 'bender-clock.html');
        }
      }
      return minutes;
    }

    /**
     * Validate if value is an accaptable minute range 0..59 and returns it.
     * @param {string} seconds The time SECONDS, 0..59
     * @return {number} seconds
     */
    function validSeconds(seconds) {
      if (isNaN(seconds)) {
        throw new Error('Attribute `time` unexpected format seconds.', 'bender-clock.html');
      } else {
        seconds = parseInt(seconds, 10);
        if (seconds < 0 || seconds > 59) {
          throw new RangeError('Attribute `time` unexpected format seconds.', 'bender-clock.html');
        }
      }
      return seconds;
    }

    //
    // Set the TIME
    //

    if (time) {
      // Validate input
      if (typeof time === 'string') {
        // Defaults
        hours = 0;
        minutes = 0;
        seconds = 0;

        timeParts = time.split(':');
        switch (timeParts.length) {
          case 3:
            seconds = validSeconds(timeParts[2]);
            // falls through
          case 2:
            minutes = validMinutes(timeParts[1]) * 60; // In seconds
            // falls through
          case 1:
            hours = validHours(timeParts[0]) * 3600; // In seconds
            break;
          default:
            throw new Error('Attribute `time` unexpected format', 'bender-clock.html');
        }
      } else {
        throw new Error('Attribute `time` unexpected format', 'bender-clock.html');
      }
    } else {
      // Use current local time
      hours = clock.getHours();
      hours = (hours > 12 ? hours - 12 : hours) * 3600; // In seconds, for 12 HOURS notation.
      minutes = clock.getMinutes() * 60; // In seconds
      seconds = clock.getSeconds();
    }

    // Degrees as time / scale ratio to 360 circle
    setRotationForElement(Math.round((hours + minutes + seconds) / 43200 * 360), 'hour--frame');
    setRotationForElement(Math.round((minutes + seconds) / 3600 * 360), 'minute--frame');
    setRotationForElement(Math.round(seconds / 60 * 360), 'second--frame');

    this.time = time;
  }

  ready() {
    super.ready();

    var _this = this;
    var hidden;
    var visibilityChange;

    // The Page Visibility API lets you know when a webpage is visible or in focus.
    // https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API

    // Set the name of the hidden property and the change event for visibility

    if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
      hidden = 'hidden';
      visibilityChange = 'visibilitychange';
    } else if (typeof document.msHidden !== 'undefined') {
      hidden = 'msHidden';
      visibilityChange = 'msvisibilitychange';
    } else if (typeof document.webkitHidden !== 'undefined') {
      hidden = 'webkitHidden';
      visibilityChange = 'webkitvisibilitychange';
    }

    /**
     * If the page is hidden, the CSS animation doesn't reflect the correct time.
     * Because animation is stopped.
     * If the page is shown again, synchronize time.
     */
    function handleVisibilityChange() {
      if (!document[hidden]) {
        _this.changeTime();
      }
    }

    // Warn if the browser doesn't support addEventListener or the Page Visibility API
    if (typeof document.addEventListener === 'undefined' || typeof document[hidden] === 'undefined') {
      throw new {
        'message': 'This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.',
        'name': 'Error',
      };
    } else {
      // Handle page visibility change
      document.addEventListener(visibilityChange, handleVisibilityChange, false);
    }

  };

  constructor() {
    super();
  }
}

window.customElements.define('bender-clock', BenderClock);
