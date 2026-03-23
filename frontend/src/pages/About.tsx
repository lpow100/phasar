import kofi_logo from "../assets/support_me_on_kofi_blue.png";

function About() {
    return (
        <div>
            <h1>Rigel - About</h1>
            <h2>Why Rigel?</h2>
            <p>Rigel is the name of a star, spcifcally a blue supergiant in the Orion constellation,<br/>
            I chose it for the name of this because I love space and I personally like the color blue</p>
            <h2>Why did I make this website?</h2>
            <p>Rigel started out as just an idea after seeing videos online about the "indie web",<br/>
            and at around the same time I heard about some policy changes with discord <br/>
            so I thought about making my own version of discord but I chose to leave some thing a bit different</p>
            <h2>How can I support?</h2>
            <p>One policy of rigel that I will never change is that all features are free<br/>
            At a later date I may add a supporter badge if you support but nothing like discord ntiro<br/>
            But to get back on topic is that if you ever want to support you can here: <a href="https://ko-fi.com/trinary"><img src={kofi_logo}/></a></p>
        </div>
    )
}

export default About