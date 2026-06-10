a=int(input("Purchase"))
t=0
if(a>5000):
    t=a*0.8
if(5000>a>2000):
    t=a*0.9
print("Total price after discount ",t)
