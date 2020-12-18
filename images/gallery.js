var things = ["cat", "dog", "food", "flower"];
var refresh_rate, selThing;


addEventListener('load', InitData);

/**
 * Initialize all controls with data from last session
 * 
 */
function InitData() {
    selThing = sessionStorage.getItem("selThing");
    if (selThing != null) {
        document.getElementById('things').value = selThing;
        ThingItemUpdate(selThing)
    }
    refresh_rate = sessionStorage.getItem("refresh_rate");
    if (refresh_rate <= 0)
        refresh_rate = 2;
    document.getElementById("refresh_rate").placeholder = refresh_rate;
    console.log("Inside InitData selThing is " + selThing);

    Refresh();
}

/**
 * Update refresh_rate
 * 
 */
function updateRefreshRate(rate) {
    if (rate <= 0)
        rate = 2;
    refresh_rate = rate;
    // localStorage stores withiout expiration
    sessionStorage.setItem("refresh_rate", rate);
    console.log("Refresh rate is updated to " + rate);
}

/**
 * Shuffle the images every refresh_rate seconds related to selected topic
 * 
 */
function Refresh() {
    selThing = document.getElementById('things').value;
    console.log("OnRefresh " + selThing + " rate is " + refresh_rate);
    setTimeout(Refresh, refresh_rate * 1000);
    changeImage(selThing);
}

function ThingItemUpdate(thing) {
    sessionStorage.setItem("selThing", thing);
    console.log("On change thing " + thing);
    changeImage(thing);
}

/**
 * Shuffle the numbers in the array
 * @param  {Array} numbers array of int to shuffle
 */
function shuffle(numbers) {
    for (var j, x, i = numbers.length; i; j = parseInt(Math.random() * i), x = numbers[--i], numbers[i] = numbers[j], numbers[j] = x);
    return numbers;
}

/**
 * Replace the image related to the input topic
 * @param  {String} selTopic image topic
 */
function changeImage(selTopic) {
    // generate random unique numbers in the range of 1 to number of images(8)
    var numbers = [];
    for (var l = 1; l <= 8; l++)
        numbers[l - 1] = l;
    var randomNumber = shuffle(numbers);

    // Update the images in all(e.g. 4 in this case) the placehoders by renaming by selected topic
    for (var l = 0; l < 4; l++) {
        var eImage = document.getElementById("image" + (l + 1));
        if (eImage) {
            var img = "images/" + selTopic + "-image-" + randomNumber[l] + ".gif";
            eImage.setAttribute("src", img);
        }
    }
}