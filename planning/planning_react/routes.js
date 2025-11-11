// Routes Configuration - Single file routing system
// Load all component files first

// Router functionality
const Router = {
    currentRoute: 'configurer',
    navigate: function(route) {
        this.currentRoute = route;
        this.render();
    },
    render: function() {
        const root = document.getElementById('root');
        const container = document.createElement('div');
        ReactDOM.render(React.createElement(App, { currentRoute: this.currentRoute }), container);
        root.innerHTML = '';
        root.appendChild(container);
    }
};
