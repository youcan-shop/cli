export default `<html>
    <head>
        <title>YC-CLI</title>
        <style>
            *{
                margin: 0;
                padding: 0;
            }
            body{
                background-color: #000;
                color: #fff;
                font-family: monospace;
                font-size: 1.2em;
                line-height: 1.5em;
            }
            #preview{
                width: 100%;
                height: 100vh;
            }
        </style>
    </head>
    <body>
             <script src="https://unpkg.com/@ungap/custom-elements-builtin"></script>
              <script type="module" src="https://unpkg.com/x-frame-bypass"></script>


        <iframe is="x-frame-bypass" id="preview"></iframe>

        <script type="module">
             import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
 
            document.addEventListener('DOMContentLoaded', () => {
                  const socketUrl = 'ws://' + window.location.host;
                    const socket = io(socketUrl);
                    socket.on('theme:reload', (data) => {
                        alert('Theme change detected, reloading...');
                        console.log(data);
                        const preview = document.getElementById('preview');
                        preview.src = "https://seller-area.youcan.shop/admin/themes/"+ data.theme_id + "/preview?template=index";
                    });
              });
        </script>
    </body>

</html>`;
