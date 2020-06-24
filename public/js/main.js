/* eslint-disable */

let token = $("#initUserToken").text();
let secret = $("#initUserSecret").text();

function renameResearch(researchId) {
    let rs = prompt("Enter New Research name","");
    if(rs != "") {
        
        $.ajax({
            url: "/api/research/" + researchId,
            method: "PUT",
            headers: { "Authorization": "Bearer " + secret },
            data: {
                "token": token,
                "name": rs
            }
        }).then(() => {
            window.location.reload();
        }).fail(function(xhr, status, error) {
            alert("Rename failed: " + JSON.parse(xhr.responseText).error);
        });
    }
}
function addResearcher(researchId) {
    let rs = prompt("Enter Researcher name to add","");
    if(rs != "") {
        
        $.post({
            url: "/api/research/" + researchId + "/researcher",
            headers: { "Authorization": "Bearer " + secret },
            data: {
                "token": token,
                "researchers": [rs]
            }
        }).then(() => {
            window.location.reload();
        }).fail(function(xhr, status, error) {
            alert("Add Researcher failed: " + JSON.parse(xhr.responseText).error);
        });
    }
}
function removeResearcher(researchId) {
    let rs = prompt("Enter Researcher name to remove","");
    if(rs != "") {
        
        $.ajax({
            url: "/api/research/" + researchId + "/researcher/" + rs,
            method: "DELETE",
            headers: { "Authorization": "Bearer " + secret },
            data: {
                "token": token
            }
        }).then(() => {
            window.location.reload();
        }).fail(function(xhr, status, error) {
            alert("Remove Researcher failed: " + JSON.parse(xhr.responseText).error);
        });
    }
}
function delResearch(researchId) {
    let rs = confirm("Are you sure you wanted to remove this research? This cannot be undone!");
    if(rs) {
        $.ajax({
            url: "/api/research/" + researchId,
            method: "DELETE",
            headers: { "Authorization": "Bearer " + secret },
            data: {
                "token": token
            }
        }).then(() => {
            window.location.reload();
        }).fail(function(xhr, status, error) {
            alert("Delete Research failed: " + JSON.parse(xhr.responseText).error);
        });
    }
}

function deleteUser(name) {
    // let rs = confirm("Are you sure you wanted to remove this user? This cannot be undone!");
    // if(rs) {
    //     $.ajax({
    //         url: "/researcher/" + name,
    //         method: "DELETE",
    //         headers: { "Authorization": "Bearer " + secret },
    //         data: {
    //             "token": token
    //         }
    //     }).then(() => {
    //         window.location.reload();
    //     }).fail(function(xhr, status, error) {
    //         alert("Delete Research failed: " + JSON.parse(xhr.responseText).error);
    //     });
    // }
}