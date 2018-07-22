# Mobile Web Specialist Certification Course - by Google/Udacity
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 3

For the **Restaurant Reviews** projects, you will incrementally convert a static webpage to a mobile-ready web application.

In **Stage Three**, you will take the connected application you built in **Stage One** and **Stage Two** and add additional functionality. You will add a form to allow users to create their own reviews. If the app is offline, your form will defer updating to the remote database until a connection is established. Finally, you’ll work to optimize your site to meet even stricter performance benchmarks than the previous project, and test again using [Lighthouse](https://developers.google.com/web/tools/lighthouse/).

### How to start?

1. Clone the following [Server Repository](https://github.com/udacity/mws-restaurant-stage-3) and run the server accordingly to its README file.

2. Clone [this repository](https://github.com/deweis/mws-restaurant-review-app) and start up a simple HTTP server to serve up the site files on your local computer.
Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer.
<br>In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.


3. With your servers running, visit the site: `http://localhost:8000`.

### Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, try to maintain use of ES6 in any additional JavaScript you write.
