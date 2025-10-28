from flask import Flask
from .models import db
from flask_migrate import Migrate  

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///marketplace.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.secret_key = "secret"  # using your current key

    db.init_app(app)
    migrate = Migrate(app, db)  

    from .routes import main
    app.register_blueprint(main)

    with app.app_context():
        db.create_all()  # optional if you want, migrate handles schema later

    return app
