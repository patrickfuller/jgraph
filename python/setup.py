import os

from setuptools import setup

setup(
    name="igraph",
    version="0.1.0",
    description="View graph data structures in the IPython notebook.",
    url="http://github.com/patrickfuller/igraph/",
    license="MIT",
    author="Patrick Fuller",
    author_email="patrickfuller@gmail.com",
    py_modules=["igraph"],
    include_package_data=True,
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Education",
        "Natural Language :: English",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
        "Programming Language :: Python :: 2",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.4",
        "Topic :: Education :: Computer Aided Instruction (CAI)"
    ],
)
