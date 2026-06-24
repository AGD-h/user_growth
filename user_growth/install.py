from user_growth.fixtures.create_mock_data import execute as create_mock_data


def after_install():
	"""Create the sample records required to evaluate the app."""
	create_mock_data()
