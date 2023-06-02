import React, { Component, createRef } from 'react'
import Canvas from './Canvas'

export default class CanvasWrapper extends Component {
    constructor(props) {
        super(props)
        this.canvasRef = createRef()
    }

    componentDidMount() {
        // Get canvas, pass to custom class
        const canvas = this.canvasRef.current
        this.canvas = new Canvas(canvas)

        // Init any event listeners
        window.addEventListener('mousemove', this.mouseMove)
        window.addEventListener('resize', this.handleResize)
    }

    componentDidUpdate(prevProps, prevState) {
        // Pass updated props to
        const newValue = this.props.whateverProperty
        this.canvas.updateValue(newValue)
    }

    componentWillUnmount() {
        // Remove any event listeners
        window.removeEventListener('mousemove', this.mouseMove)
        window.removeEventListener('resize', this.handleResize)
    }

    // ******************* EVENT LISTENERS ******************* //
    mouseMove = (event) => {
        this.canvas.onMouseMove()
    }

    handleResize = () => {
        this.canvas.onWindowResize(window.innerWidth, window.innerHeight)
    }

    render() {
        return (
            <div class="canvasContainer">
                <canvas ref={this.canvasRef} />
            </div>
        )
    }
}
