[![dependencies Status](https://david-dm.org/raiffeisensoftware/build-your-own-radar/status.svg)](https://david-dm.org/raiffeisensoftware/build-your-own-radar)
[![devDependencies Status](https://david-dm.org/raiffeisensoftware/build-your-own-radar/dev-status.svg)](https://david-dm.org/raiffeisensoftware/build-your-own-radar?type=dev)
[![peerDependencies Status](https://david-dm.org/raiffeisensoftware/build-your-own-radar/peer-status.svg)](https://david-dm.org/raiffeisensoftware/build-your-own-radar?type=peer)
[![GitHub contributors](https://badgen.net/github/contributors/raiffeisensoftware/build-your-own-radar?color=cyan)](https://github.com/raiffeisensoftware/build-your-own-radar/graphs/contributors)
[![AGPL License](https://badgen.net/github/license/raiffeisensoftware/build-your-own-radar)](https://github.com/raiffeisensoftware/build-your-own-radar)

A library that generates an interactive radar, inspired by [thoughtworks.com/radar](http://thoughtworks.com/radar) and improved by [Raiffeisen Software](https://www.r-software.at/).

## Demo

You can see this in action at https://radar.thoughtworks.com. If you plug in [this data](https://docs.google.com/spreadsheets/d/1YXkrgV7Y6zShiPeyw4Y5_19QOfu5I6CyH5sGnbkEyiI/) you'll see [this visualization](https://radar.thoughtworks.com/?sheetId=https://docs.google.com/spreadsheets/d/1YXkrgV7Y6zShiPeyw4Y5_19QOfu5I6CyH5sGnbkEyiI). 

## Configuration

You can provide a configuration file named `config.json` in the main folder and define many of the radars properties this way.
This will allow you to display empty quadrants and rings. 
In this case, the created quardants and rings will be based on your `config.json` instead of the provided sheet.
For a basic setup simply just rename the `example.config.json` file in the main folder to `config.json`.

config.json properties:

- `legend` The `triangleKey` and `circlekey` keys refere to the description next to the triangle and circle icons in the legend.
- `rings` Array that defines the names of the rings. Rings will be displayed in the order in which they are listed starting from the center.
- `quadrants` Array that defines the names of the quadrants. Quadrants will be displayed in the order in which they are listed starting from the upper right and continuing counterclockwise. Must have 4 entries.
- `header` is the Header displayed at the top from Bootstrap class *md*. The header string must be a valid url or the name of an image file you placed in the `src/images` folder. If not specified, defaults to `tech-radar-landing-page-wide.png`
- `mobileHeader` is the Header displayed at the top from Bootstrap classes up to *md*. The header string must be a valid url or the name of an image file you placed in the `src/images` folder. If not specified, defaults to `tech-radar-landing-page-wide.png`
- `radarBaseUrl` Is a base url with placeholders that are encased by square brackets `[]`.
- `platformPath` If set, shows a link in the top left with the a link to the specified path
- `CsvQueryParams` allows you to use set queryParameters to replace `radarBaseUrl` placeholders of the same name by a queryParameter or if none is provided, a default value stored as the value of the placeholder entry.
- `footerText` Sets the text for the footer allowing customization.
- `emptyQuadrantText` When set displays a message instead of a empty Quadrant Table

## How To Use

The easiest way to use the app out of the box is to provide a *public* Google Sheet ID from which all the data will be fetched. You can enter that ID into the input field on the first page of the application, and your radar will be generated. The data must conform to the format below for the radar to be generated correctly.

### Setting up your data

You need to make your data public in a form we can digest.

Create a Google Sheet. Give it at least the below column headers, and put in the content that you want:

|id| name          | ring   | quadrant               | isNew | description                                             |
|-----|---------------|--------|------------------------|-------|---------------------------------------------------------|
|Composer| Composer      | adopt  | tools | TRUE  | Although the idea of dependency management ...          |
|Canary+builds| Canary builds | trial  | techniques | FALSE | Many projects have external code dependencies ...       |
|Apache+Kylin| Apache Kylin  | assess | platforms | TRUE  | Apache Kylin is an open source analytics solution ...   |
|JSF | JSF           | hold   | languages & frameworks | FALSE | We continue to see teams run into trouble using JSF ... |

### Sharing the sheet

* In Google sheets, go to 'File', choose 'Publish to the web...' and then click 'Publish'.
* Close the 'Publish to the web' dialog.
* Copy the URL of your editable sheet from the browser (Don't worry, this does not share the editable version). 

The URL will be similar to [https://docs.google.com/spreadsheets/d/1waDG0_W3-yNiAaUfxcZhTKvl7AUCgXwQw8mdPjCz86U/edit](https://docs.google.com/spreadsheets/d/1waDG0_W3-yNiAaUfxcZhTKvl7AUCgXwQw8mdPjCz86U/edit). In theory we are only interested in the part between '/d/' and '/edit' but you can use the whole URL if you want.

### Using CSV data
The other way to provide your data is using CSV document format.
You can enter any URL that responds CSV data into the input field on the first page.
The format is just the same as that of the Google Sheet, the example is as follows:

```
id,name,ring,quadrant,isNew,description  
Composer,Composer,adopt,tools,TRUE,"Although the idea of dependency management ..."  
Canary+builds,Canary builds,trial,techniques,FALSE,"Many projects have external code dependencies ..."  
Apache+Kylin,Apache Kylin,assess,platforms,TRUE,"Apache Kylin is an open source analytics solution ..."  
JSF,JSF,hold,languages & frameworks,FALSE,"We continue to see teams run into trouble using JSF ..."  
```

***Note:*** The CSV file parsing is using D3 library, so consult the D3 documentation for the data format details.

### Building the radar

Paste the URL in the input field on the home page.

That's it!

***Note:*** The quadrants of the radar, and the order of the rings inside the radar will be drawn in the order they appear in your configuration.

### More complex usage

To create the data representation, you can use the Google Sheet [factory](/src/util/factory.js) or CSV, or you can also insert all your data straight into the code.

The application uses [webpack](https://webpack.github.io/) to package dependencies and minify all .js and .scss files.

## Docker Image
We have released BYOR as a docker image for our users. The image is available in our [DockerHub Repo](https://hub.docker.com/r/wwwthoughtworks/build-your-own-radar/). To pull and run the image, run the following commands.

```
$ docker pull wwwthoughtworks/build-your-own-radar
$ docker run --rm -p 8080:80 -e SERVER_NAMES="localhost 127.0.0.1" wwwthoughtworks/build-your-own-radar
$ open http://localhost:8080
```

## Contribute

All tasks are defined in `package.json`.

Pull requests are welcome; please write tests whenever possible. 
Make sure you have nodejs installed.

- `git clone git@github.com:thoughtworks/build-your-own-radar.git`
- `cp example.config.json config.json` - OPTIONAL: example.config.json will give you an idea of a basic configuration
- `npm install`
- `npm test` - to run your tests
- `npm run dev` - to run application in localhost:8080. This will watch the .js and .css files and rebuild on file changes

if the optional step is skipped the quadrants/rings will be deducted from the provided sheet.

### Don't want to install node? Run with one line docker

     $ docker run -p 8080:8080 -v $PWD:/app -w /app -it node:10.15.3 /bin/sh -c 'npm install && npm run dev'

***Note***: If you are facing Node-sass compile error while running, please prefix the command `npm rebuild node-sass` before `npm run dev`. like this
```
npm install && npm rebuild node-sass && npm run dev
```

After building it will start on `localhost:8080`

## Icon Credits 
<div>Printer Icon made by <a href="https://www.flaticon.com/authors/gregor-cresnar" title="Gregor Cresnar">Gregor Cresnar</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
<div>Share Icon made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
