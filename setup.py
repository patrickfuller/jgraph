from setuptools import setup
from python import __version__

setup(
    name="jgraph",
    version=__version__,
    description="View graph data structures in the IPython notebook.",
    url="http://github.com/patrickfuller/jgraph/",
    license="MIT",
    author="Patrick Fuller",
    author_email="patrickfuller@gmail.com",
    package_dir={'jgraph': 'python',
                 'jgraph.js': 'js'},
    package_data={'jgraph.js': ['js/build/jgraph.min.js']},
    include_package_data=True,
    packages=['jgraph', 'jgraph.js'],
    install_requires=['ipython'],
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Education',
        'Natural Language :: English',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.4',
        'Framework :: IPython',
        'Topic :: Education :: Computer Aided Instruction (CAI)'
    ]
)
