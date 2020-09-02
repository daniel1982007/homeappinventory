import axios from "axios"

export default class Search {
    constructor() {
        this.injectHTML()
        this.headerSearchIcon = document.querySelector(".fa-search")
        this.overlay = document.querySelector(".search-overlay")
        this.closeIcon = document.querySelector(".fa-close")
        this.liveSearchField = document.querySelector("#searchInput")
        this.loaderSpinnerDiv = document.querySelector(".loader-search")
        this.searchResultsDiv = document.querySelector(".live-search-results")
        this.previousValue = ""
        this.typingWaitTimer
        this.events()
    }

    // events
    events() {
        this.headerSearchIcon.addEventListener("click", (e) => {
            e.preventDefault()
            this.openSearchOverlay()
        })
        this.closeIcon.addEventListener("click", () => this.closeOverlay())
        this.liveSearchField.addEventListener("keyup", () => this.keyPressHandler())
    }

    // methods related to events
    openSearchOverlay() {
        this.overlay.classList.add("search-overlay--visible")
        this.liveSearchField.value = ""
        setTimeout(() => this.liveSearchField.focus(), 200)
    }

    closeOverlay() {
        this.overlay.classList.remove("search-overlay--visible")
    }

    keyPressHandler() {
        // each time when strike the keyboard in search field, js will run keypresshandler function(async function starts)
        let value = this.liveSearchField.value
        // after key strike starts to check if else
        if(value != "" && value != this.previousValue) {
            // settimeout is an async function
            clearTimeout(this.typingWaitTimer)
            this.showLoaderIconDiv()
            this.hideSearchResultsDiv()
            this.typingWaitTimer = setTimeout(() => this.sendRequestOut(), 3000)
        }
        if(value == "") {
            clearTimeout(this.typingWaitTimer)
            this.hideLoaderIconDiv()
        }
        this.previousValue = value
    }

    sendRequestOut() {
        axios.post("/search", {searchTerm: this.liveSearchField.value}).then((response) => {
            console.log(response.data)
            this.searchResultsHTML(response.data)
            this.hideLoaderIconDiv()
        }).catch(() => {
            alert("sorry, try again later")
        })
    }

    showLoaderIconDiv() {
        this.loaderSpinnerDiv.classList.add("loader-search--visible")
    }

    hideLoaderIconDiv() {
        this.loaderSpinnerDiv.classList.remove("loader-search--visible")
    }

    showSearchResultsDiv() {
        this.searchResultsDiv.classList.add("live-search-results--visible")
    }

    hideSearchResultsDiv() {
        this.searchResultsDiv.classList.remove("live-search-results--visible")
    }

    searchResultsHTML(posts) {
        this.searchResultsDiv.innerHTML= `<ul class="list-group">
        <li class="list-group-item active">一共搜索到${posts.length}条结果</li>
        ${posts.map((post) => {
            let date = new Date(post.createDate)
            return `<li class="list-item">
                    <a href="/${post.category}/${post._id}" class="a-flex"><img src="${post.author.avatar}" class="avatar-tiny"> <p class="search-title-size">${post.name}</p>  创建人${post.author.username} 于 ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}</a>
                </li>`
        }).join("")}
    </ul>`
        this.showSearchResultsDiv()
    }

    injectHTML() {
        document.body.insertAdjacentHTML("beforeend", `<div class="search-overlay">
            <div class="search-overlay-top">
                <div class="container-md p-3 d-flex flex-row">
                    <div class="col-1"><i class="fa fa-search fa-2x"></i></div>
                    <input id="searchInput" name="searchInput" class="col-10" placeholder="您想要搜寻什么...">
                    <div class="col-1"><a><i class="fa fa-close fa-2x"></i></a></div>
                    
                </div>
            </div>
            <div class="search-overlay-bottom">
                <div class="container">
                    <div class="loader-search"><i class="fa fa-spinner fa-spin fa-2x"></i></div>
                    <div class="live-search-results"></div>
                </div>
            </div>
        </div>`)
    }
}