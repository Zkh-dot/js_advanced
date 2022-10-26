function send_new_msg(){
    xml = new XMLHttpRequest() 
    xml.open("POST", document.location.toString() + "/send")
    xml.send(document.getElementById('newmsg').value)
    let container = document.createElement('div')
    container.append(`from ${document.getElementById('whoami?').textContent}: ${document.getElementById('newmsg').value}`)
    document.getElementById("inpukt").before(container)
    document.getElementById('newmsg').value = ''
}